import mongoose from "mongoose"
import http from "node:http"
import { createApp } from "./app.js"

export async function startServer({port, mongoUri})
{
    await mongoose.connect(mongoUri)

    const httpServer = http.createServer(createApp())

    await new Promise(resolve => httpServer.listen(port, resolve))

    return{
        port : httpServer.address().port,
        async close()
        {
            await new Promise(resolve => httpServer.close(resolve))
            await mongoose.disconnect()
        }
    }
}