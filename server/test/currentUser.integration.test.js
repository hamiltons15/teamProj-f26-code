import test from "node:test"
import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { startServer } from "../src/server.js"
import { User } from "../src/models/User.js"
import { createToken } from "../src/services/token.js"

// Test the current user endpoint using a separate database
test("current user integration", async (t) => {
    // Use a random test secret and database so existing users are not affected
    process.env.JWT_SECRET = randomBytes(32).toString("hex")
    const database = "bkb_auth_test_" + Date.now() + "_" + randomBytes(4).toString("hex")
    const running = await startServer({
        port : 0,
        mongoUri : "mongodb://127.0.0.1:27017/" + database
    })
    // Close the server and database connection after testing
    t.after(async () => {
        await running.close()
    })

    const base = "http://127.0.0.1:" + running.port
    // Send a JSON request to the authentication API
    const post = (path, body) => fetch(base + "/api/auth/" + path, {
        method : "POST",
        headers : { "Content-Type" : "application/json" },
        body : JSON.stringify(body)
    })
    // Send a request to the protected endpoint with an optional authorization header
    const me = (authorization) => fetch(base + "/api/auth/me", {
        headers : authorization === undefined ? {} : { Authorization : authorization }
    })
    // Register and log in a test user to get both tokens
    const credentials = { username : "CurrentUser", password : "ExamplePassword123" }
    const registered = await post("register", credentials)
    assert.equal(registered.status, 201)
    const account = await registered.json()
    const loggedIn = await post("login", credentials)
    assert.equal(loggedIn.status, 200)
    const login = await loggedIn.json()
    // Create test tokens with different claims and signing options
    const sign = (claims = {}, options = {}, secret = process.env.JWT_SECRET) =>
        jwt.sign({ sub : account.user.id, ...claims }, secret, {
            algorithm : "HS256", issuer : "ball-knowledge-bulletin-api",
            audience : "ball-knowledge-bulletin-client", expiresIn : "8h", ...options
        })

    await t.test("registration and login tokens identify the same user", async () => {
        for(const token of [account.token, login.token])
        {
            const response = await me("Bearer " + token)
            assert.equal(response.status, 200)
            assert.deepEqual(await response.json(), { user : account.user })
        }
        const response = await me("bearer " + login.token)
        assert.equal(response.status, 200)
        assert.deepEqual(await response.json(), { user : account.user })
    })

    await t.test("rejects missing or malformed authorization headers", async () => {
        for(const header of [undefined, "Bearer", "Bearer ", "Basic abc", "Bearer one two"])
        {
            const response = await me(header)
            assert.equal(response.status, 401)
            assert.deepEqual(await response.json(), { error : "Authentication required." })
        }
    })

    await t.test("rejects malformed, tampered and incorrectly signed tokens", async () => {
        // Change the token signature to test tampering
        const parts = login.token.split(".")
        parts[2] = (parts[2][0] === "a" ? "b" : "a") + parts[2].slice(1)
        for(const token of ["not-a-jwt", parts.join("."), sign({}, {}, randomBytes(32).toString("hex"))])
        {
            const response = await me("Bearer " + token)
            assert.equal(response.status, 401)
            assert.deepEqual(await response.json(), { error : "Invalid or expired authentication token." })
        }
    })

    await t.test("rejects expired and not-yet-valid tokens", async () => {
        for(const token of [sign({}, { expiresIn : -1 }), sign({}, { notBefore : "1h" })])
        {
            const response = await me("Bearer " + token)
            assert.equal(response.status, 401)
            assert.deepEqual(await response.json(), { error : "Invalid or expired authentication token." })
        }
    })

    await t.test("rejects wrong issuer, audience and algorithm", async () => {
        for(const options of [{ issuer : "wrong" }, { audience : "wrong" }, { algorithm : "HS384" }])
        {
            const response = await me("Bearer " + sign({}, options))
            assert.equal(response.status, 401)
            assert.deepEqual(await response.json(), { error : "Invalid or expired authentication token." })
        }
    })

    await t.test("rejects missing or invalid subject and missing expiration", async () => {
        const noExpiration = jwt.sign({ sub : account.user.id }, process.env.JWT_SECRET, {
            algorithm : "HS256", issuer : "ball-knowledge-bulletin-api",
            audience : "ball-knowledge-bulletin-client"
        })
        for(const token of [jwt.sign({}, process.env.JWT_SECRET, { algorithm : "HS256", issuer : "ball-knowledge-bulletin-api", audience : "ball-knowledge-bulletin-client", expiresIn : "8h" }), sign({ sub : null }), sign({ sub : "invalid" }),
            sign({ sub : 123 }), noExpiration])
        {
            const response = await me("Bearer " + token)
            assert.equal(response.status, 401)
            assert.deepEqual(await response.json(), { error : "Invalid authentication token." })
        }
    })

    await t.test("rejects tokens for nonexistent or deleted users", async () => {
        const missing = createToken(new mongoose.Types.ObjectId())
        const response = await me("Bearer " + missing)
        assert.equal(response.status, 401)
        assert.deepEqual(await response.json(), { error : "Authenticated user no longer exists." })

        // Delete the test user and check that their token no longer works on this endpoint
        await User.deleteOne({ _id : account.user.id })
        const deleted = await me("Bearer " + login.token)
        assert.equal(deleted.status, 401)
        assert.deepEqual(await deleted.json(), { error : "Authenticated user no longer exists." })
    })

    // Disconnect MongoDB to make sure the endpoint returns a 503 error
    await t.test("rejects current user lookup when database is disconnected", async () => {
        await mongoose.disconnect()
        const response = await me("Bearer " + login.token)
        assert.equal(response.status, 503)
        assert.deepEqual(await response.json(), { error : "Database unavailable." })
    })
})
