import mongoose from "mongoose"

export function requireDatabase(request, response, next)
{
    if(mongoose.connection.readyState !== mongoose.ConnectionStates.connected)
    {
        return response.status(503).json({ error : "Database unavailable." })
    }
    next()
}
