import mongoose from "mongoose"
import { HttpStatus } from "../http/status.js"

// Make sure MongoDB is connected before handling the request
export function requireDatabase(request, response, next)
{
    if(mongoose.connection.readyState !== mongoose.ConnectionStates.connected)
    {
        return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({ error : "Database unavailable." })
    }
    next()
}
