import test from "node:test"
import assert from "node:assert/strict"
import { randomBytes } from "node:crypto"
import mongoose from "mongoose"
import { startServer } from "../src/server.js"
import { User } from "../src/models/User.js"
import { verifyPassword } from "../src/services/password.js"
import { verifyToken } from "../src/services/token.js"
import { HttpStatus } from "../src/http/status.js"

// Test the registration endpoint using a separate database
test("registration integration", async (t) => {
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
    const register = (body) => fetch(base + "/api/auth/register", {
        method : "POST",
        headers : { "Content-Type" : "application/json" },
        body : JSON.stringify(body)
    })

    await t.test("health endpoint remains available", async () => {
        const response = await fetch(base + "/api/health")
        assert.equal(response.status, HttpStatus.OK)
        assert.deepEqual(await response.json(), { status : "ok", db : "connected" })
    })

    await t.test("registers normalized username, stores hash and issues JWT", async () => {
        const password = "ExamplePassword123"
        const response = await register({ username : " Alice_1 ", password })
        assert.equal(response.status, HttpStatus.CREATED)
        const body = await response.json()
        assert.deepEqual(Object.keys(body).sort(), ["message", "token", "user"])
        assert.deepEqual(Object.keys(body.user).sort(), ["id", "username"])
        assert.equal(body.user.username, "alice_1")
        assert.equal(verifyToken(body.token).sub, body.user.id)

        // Check the stored hash and make sure it is hidden from normal queries
        const stored = await User.findById(body.user.id).select("+passwordHash")
        assert.equal(stored.username, "alice_1")
        assert.notEqual(stored.passwordHash, password)
        assert.equal(await verifyPassword(password, stored.passwordHash), true)
        assert.equal((await User.findById(body.user.id)).passwordHash, undefined)
    })

    await t.test("rejects invalid registration inputs", async () => {
        for(const body of [{}, { username : "ab", password : "ExamplePassword123" },
            { username : "valid_user", password : "short" },
            { username : "valid_user", password : "é".repeat(37) },
            { username : 123, password : "ExamplePassword123" }])
        {
            const response = await register(body)
            assert.equal(response.status, HttpStatus.BAD_REQUEST)
            assert.equal(typeof (await response.json()).error, "string")
        }
        assert.equal(await User.countDocuments(), 1)
    })

    await t.test("rejects malformed JSON", async () => {
        const response = await fetch(base + "/api/auth/register", {
            method : "POST",
            headers : { "Content-Type" : "application/json" },
            body : '{"username":'
        })
        assert.equal(response.status, HttpStatus.BAD_REQUEST)
        assert.deepEqual(await response.json(), { error : "Invalid JSON body." })
    })

    await t.test("rejects duplicate normalized username", async () => {
        const response = await register({ username : " ALICE_1 ", password : "ExamplePassword123" })
        assert.equal(response.status, HttpStatus.CONFLICT)
        assert.deepEqual(await response.json(), { error : "Username is already registered." })
        assert.equal(await User.countDocuments({ username : "alice_1" }), 1)
    })

    await t.test("rejects concurrent duplicate registrations", async () => {
        // Send two registration requests at the same time to check for duplicate accounts
        const responses = await Promise.all([
            register({ username : "RaceUser", password : "ExamplePassword123" }),
            register({ username : " raceuser ", password : "ExamplePassword456" })
        ])
        assert.deepEqual(responses.map(response => response.status).sort(), [HttpStatus.CREATED, HttpStatus.CONFLICT])
        for(const response of responses)
        {
            const body = await response.json()
            if(response.status === HttpStatus.CONFLICT)
            {
                assert.deepEqual(body, { error : "Username is already registered." })
            }
            else
            {
                assert.equal(verifyToken(body.token).sub, body.user.id)
            }
        }
        assert.equal(await User.countDocuments({ username : "raceuser" }), 1)
    })

    // Disconnect MongoDB to make sure the endpoint returns a 503 error
    await t.test("rejects registration when database is disconnected", async () => {
        await mongoose.disconnect()
        const response = await register({ username : "offline_user", password : "ExamplePassword123" })
        assert.equal(response.status, HttpStatus.SERVICE_UNAVAILABLE)
        assert.deepEqual(await response.json(), { error : "Database unavailable." })
    })
})
