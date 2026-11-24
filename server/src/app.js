import express from "express"
import cors from "cors"
import mongoose from "mongoose"

const BODY_LIMIT = "16kb"

export function createApp(){
    const app = express()
    app.use(cors({ origin : process.env.CLIENT_ORIGIN }))
    app.use(express.json({ limit: BODY_LIMIT }))

    app.get("/api/health", (request, response) => {
        const db = mongoose.connection.readyState === mongoose.ConnectionStates.connected
            ? "connected"
            : "disconnected"
        response.json({ status : "ok", db})
    })
    
    return app
}