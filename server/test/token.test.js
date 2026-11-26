import test from "node:test"
import assert from "node:assert/strict"
import jwt from "jsonwebtoken"
import { getJwtSecret, createToken, verifyToken } from "../src/services/token.js"

const SECRET = "0".repeat(64)
const USER_ID = "507f1f77bcf86cd799439011"

test("JWT secret validation", () => {
    for(const secret of ["", "invalid", "z".repeat(64)])
    {
        process.env.JWT_SECRET = secret
        assert.throws(getJwtSecret, /64-character hexadecimal/)
    }
    process.env.JWT_SECRET = SECRET
    assert.equal(getJwtSecret(), SECRET)
})

test("JWT claims and verification", () => {
    process.env.JWT_SECRET = SECRET
    const token = createToken(USER_ID)
    const claims = verifyToken(token)
    assert.equal(claims.sub, USER_ID)
    assert.equal(claims.iss, "ball-knowledge-bulletin-api")
    assert.equal(claims.aud, "ball-knowledge-bulletin-client")
    assert.equal(claims.exp - claims.iat, 8 * 60 * 60)
    assert.throws(() => verifyToken(token.slice(0, -2) + "!!"))
})

test("JWT rejects expired tokens, wrong claims and algorithms", () => {
    process.env.JWT_SECRET = SECRET
    const options = { algorithm : "HS256", issuer : "ball-knowledge-bulletin-api",
        audience : "ball-knowledge-bulletin-client", expiresIn : "8h" }
    for(const overrides of [{ expiresIn : -1 }, { issuer : "wrong" },
        { audience : "wrong" }, { algorithm : "HS384" }])
    {
        const token = jwt.sign({ sub : USER_ID }, SECRET, { ...options, ...overrides })
        assert.throws(() => verifyToken(token))
    }
})
