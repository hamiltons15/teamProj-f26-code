import mongoose from "mongoose"
import http from "node:http"
import { createApp } from "./app.js"
import { User } from "./models/User.js"
import { getJwtSecret } from "./services/token.js"

export async function startServer({port, mongoUri})
{
    // Make sure the JWT secret is valid before connecting to MongoDB
    getJwtSecret()
    await mongoose.connect(mongoUri)

    try
    {
        // Make sure the unique username index is created before accepting requests
        await User.init()
        const httpServer = http.createServer(createApp())

        await new Promise((resolve, reject) => {
            // Handle errors that occur when starting the server
            httpServer.once("error", reject)
            httpServer.listen(port, resolve)
        })

        return{
            port : httpServer.address().port,
            async close()
            {
                await new Promise(resolve => httpServer.close(resolve))
                await mongoose.disconnect()
            }
        }
    }
    // Disconnect from MongoDB if the server fails to start
    catch(error)
    {
        await mongoose.disconnect()
        throw error
    }
}
