import test from "node:test"
import assert from "node:assert/strict"
import { startServer } from "../src/server.js"

test("startup rejects invalid JWT secrets before connecting to MongoDB", async () => {
    for(const secret of ["", "invalid"])
    {
        process.env.JWT_SECRET = secret
        await assert.rejects(startServer({ port : 0, mongoUri : "invalid" }),
            /JWT_SECRET must be a 64-character hexadecimal secret/)
    }
})
