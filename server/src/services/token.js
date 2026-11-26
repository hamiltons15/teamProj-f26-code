import jwt from "jsonwebtoken"

const ISSUER = "ball-knowledge-bulletin-api"
const AUDIENCE = "ball-knowledge-bulletin-client"

export function getJwtSecret()
{
    const secret = process.env.JWT_SECRET
    if(!secret || !/^[0-9a-f]{64}$/i.test(secret))
    {
        throw new Error("JWT_SECRET must be a 64-character hexadecimal secret.")
    }
    return secret
}

export function createToken(userId)
{
    return jwt.sign({ sub : userId.toString() }, getJwtSecret(),
        { algorithm : "HS256", expiresIn : "8h", issuer : ISSUER, audience : AUDIENCE })
}

export function verifyToken(token)
{
    return jwt.verify(token, getJwtSecret(),
        { algorithms : ["HS256"], issuer : ISSUER, audience : AUDIENCE })
}
