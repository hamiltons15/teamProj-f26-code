import test from "node:test"
import assert from "node:assert/strict"
import { User } from "../src/models/User.js"

test("User normalizes usernames and requires password hashes", async () => {
    const user = new User({ username : " Alice_1 ", passwordHash : "test-hash" })
    await user.validate()
    assert.equal(user.username, "alice_1")
    await assert.rejects(new User({ username : "alice" }).validate())
    await assert.rejects(new User({ username : "bad name", passwordHash : "hash" }).validate())
    assert.equal(User.schema.path("passwordHash").options.select, false)
    assert.ok(User.schema.indexes().some(([fields, options]) =>
        fields.username === 1 && options.unique === true))
})
