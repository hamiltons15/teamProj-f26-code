import test from "node:test"
import assert from "node:assert/strict"
import { hashPassword, verifyPassword } from "../src/services/password.js"

test("passwords are salted and verified", async () => {
    const password = "ExamplePassword"
    const first = await hashPassword(password)
    const second = await hashPassword(password)
    assert.notEqual(first, password)
    assert.notEqual(first, second)
    assert.equal(await verifyPassword(password, first), true)
    assert.equal(await verifyPassword("wrongPassword", first), false)
})
