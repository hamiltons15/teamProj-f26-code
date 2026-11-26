import test from "node:test"
import assert from "node:assert/strict"
import { validateRegistration } from "../src/domain/validateRegistration.js"

test("registration accepts normalized usernames and valid passwords", () => {
    assert.equal(validateRegistration(" Alice_1 ", "12345678"), null)
    assert.equal(validateRegistration("alice", "a".repeat(72)), null)
    assert.equal(validateRegistration("alice", "é".repeat(36)), null)
})

test("registration rejects invalid inputs", () => {
    for(const username of [null, "", "ab", "a".repeat(31), "bad name", "bad-name"])
    {
        assert.notEqual(validateRegistration(username, "12345678"), null)
    }
    for(const password of [null, 12345678, "1234567", "a".repeat(73), "é".repeat(37)])
    {
        assert.notEqual(validateRegistration("alice", password), null)
    }
})
