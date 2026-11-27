import mongoose from "mongoose"
import { verifyToken } from "../services/token.js"

export function requireAuth(request, response, next)
{
    const authorization = request.headers.authorization
    const match = typeof authorization === "string" && /^Bearer +([^\s]+)$/i.exec(authorization)
    if(!match)
    {
        return response.status(401).json({ error : "Authentication required." })
    }

    try
    {
        const decoded = verifyToken(match[1])
        if(typeof decoded.sub !== "string" || !mongoose.isObjectIdOrHexString(decoded.sub) ||
            !Number.isFinite(decoded.exp))
        {
            return response.status(401).json({ error : "Invalid authentication token." })
        }

        request.userId = decoded.sub
    }
    catch(error)
    {
        if(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name))
        {
            return response.status(401).json({ error : "Invalid or expired authentication token." })
        }
        return response.status(500).json({ error : "Unable to authenticate request." })
    }
    next()
}
