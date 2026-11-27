import mongoose from "mongoose"
import { verifyToken } from "../services/token.js"

// Verify the JWT before allowing access to a protected route
export function requireAuth(request, response, next)
{
    // Get the token from the authorization header
    const authorization = request.headers.authorization
    const match = typeof authorization === "string" && /^Bearer +([^\s]+)$/i.exec(authorization)
    if(!match)
    {
        return response.status(401).json({ error : "Authentication required." })
    }

    try
    {
        // Verify the token and check for a valid user ID and expiration
        const decoded = verifyToken(match[1])
        if(typeof decoded.sub !== "string" || !mongoose.isObjectIdOrHexString(decoded.sub) ||
            !Number.isFinite(decoded.exp))
        {
            return response.status(401).json({ error : "Invalid authentication token." })
        }

        // Store the user ID so the route can identify the user
        request.userId = decoded.sub
    }
    catch(error)
    {
        // Reject invalid or expired tokens
        if(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name))
        {
            return response.status(401).json({ error : "Invalid or expired authentication token." })
        }
        return response.status(500).json({ error : "Unable to authenticate request." })
    }
    next()
}
