import test from "node:test"
import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import mongoose from "mongoose"
import { startServer } from "../src/server.js"
import { User } from "../src/models/User.js"
import { verifyToken } from "../src/services/token.js"
import { HttpStatus } from "../src/http/status.js"

// Test the login endpoint using a separate database
test("login integration", async (t) => {
    // Use a random test secret and database so existing users are not affected
    process.env.JWT_SECRET = randomBytes(32).toString("hex")
    const database = "bkb_auth_test_" + Date.now() + "_" + randomBytes(4).toString("hex")
    const mongoUri = "mongodb://127.0.0.1:27017/" + database
    let running

    // Close the server and drop the test database using a separate connection
    t.after(async () => {
        try
        {
            if(running)
            {
                await running.close()
            }
        }
        finally
        {
            const cleanupConnection = mongoose.createConnection(mongoUri)
            try
            {
                await cleanupConnection.asPromise()
                await cleanupConnection.dropDatabase()
            }
            finally
            {
                await cleanupConnection.close()
            }
        }
    })

    running = await startServer({ port : 0, mongoUri })

    const base = "http://127.0.0.1:" + running.port
    // Send a JSON request to the authentication API
    const post = (path, body) => fetch(base + "/api/auth/" + path, {
        method : "POST",
        headers : { "Content-Type" : "application/json" },
        body : JSON.stringify(body)
    })
    // Register a test account to use for the login tests
    const password = "ExamplePassword123"
    const registered = await post("register", { username : "LoginUser", password })
    assert.equal(registered.status, HttpStatus.CREATED)
    const account = await registered.json()

    await t.test("valid credentials return user and signed JWT", async () => {
        const response = await post("login", { username : "loginuser", password })
        assert.equal(response.status, HttpStatus.OK)
        const body = await response.json()
        assert.deepEqual(Object.keys(body).sort(), ["message", "token", "user"])
        assert.equal(body.message, "Login successful.")
        assert.deepEqual(body.user, account.user)
        assert.equal(verifyToken(body.token).sub, account.user.id)
    })

    await t.test("login normalizes username", async () => {
        const response = await post("login", { username : " LOGINUSER ", password })
        assert.equal(response.status, HttpStatus.OK)
        assert.deepEqual((await response.json()).user, account.user)
    })

    await t.test("wrong password and unknown username return identical errors", async () => {
        for(const body of [{ username : "loginuser", password : "wrongPassword" },
            { username : "unknown_user", password },
            { username : "loginuser", password : password + " " }])
        {
            const response = await post("login", body)
            assert.equal(response.status, HttpStatus.UNAUTHORIZED)
            assert.deepEqual(await response.json(), { error : "Invalid username or password." })
        }
    })

    await t.test("rejects missing or malformed credentials", async () => {
        for(const body of [{}, { username : "loginuser" }, { password },
            { username : " ", password }, { username : "loginuser", password : "" },
            { username : 123, password }, { username : "loginuser", password : {} }])
        {
            const response = await post("login", body)
            assert.equal(response.status, HttpStatus.BAD_REQUEST)
            assert.deepEqual(await response.json(), { error : "Username and password are required." })
        }
    })

    await t.test("rejects passwords exceeding bcrypt byte limit", async () => {
        // Check that a 72-byte password works but longer passwords are rejected
        const boundaryPassword = "a".repeat(72)
        const response = await post("register", { username : "boundary_user", password : boundaryPassword })
        assert.equal(response.status, HttpStatus.CREATED)
        await response.json()
        const valid = await post("login", { username : "boundary_user", password : boundaryPassword })
        assert.equal(valid.status, HttpStatus.OK)
        await valid.json()

        for(const password of [boundaryPassword + "x", "é".repeat(37)])
        {
            const response = await post("login", { username : "boundary_user", password })
            assert.equal(response.status, HttpStatus.BAD_REQUEST)
            assert.deepEqual(await response.json(), { error : "Password must not exceed 72 UTF-8 bytes." })
        }
    })

    await t.test("login does not create or modify accounts", async () => {
        // Compare the account before and after login to make sure it was not changed
        const before = await User.findById(account.user.id).select("+passwordHash").lean()
        const response = await post("login", { username : "loginuser", password })
        assert.equal(response.status, HttpStatus.OK)
        await response.json()
        const after = await User.findById(account.user.id).select("+passwordHash").lean()
        assert.deepEqual(after, before)
        assert.equal(await User.countDocuments(), 2)
    })

    // Disconnect MongoDB to make sure the endpoint returns a 503 error
    await t.test("rejects login when database is disconnected", async () => {
        await mongoose.disconnect()
        const response = await post("login", { username : "loginuser", password })
        assert.equal(response.status, HttpStatus.SERVICE_UNAVAILABLE)
        assert.deepEqual(await response.json(), { error : "Database unavailable." })
    })
})
