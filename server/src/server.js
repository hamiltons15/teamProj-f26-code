import mongoose from "mongoose"
import http from "node:http"
import { createApp } from "./app.js"
import { User } from "./models/User.js"
import { getJwtSecret } from "./services/token.js"

export async function startServer({port, mongoUri})
{
    getJwtSecret()
    await mongoose.connect(mongoUri)

    try
    {
        await User.init()
        const httpServer = http.createServer(createApp())

        await new Promise((resolve, reject) => {
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
    catch(error)
    {
        await mongoose.disconnect()
        throw error
    }
}
