import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import { authRouter } from "./routes/auth.js"

const BODY_LIMIT = "16kb"

export function createApp(){
    const app = express()
    app.use(cors({ origin : process.env.CLIENT_ORIGIN }))
    app.use(express.json({ limit: BODY_LIMIT }))

    // Set up the routes for registration, login, and user identification
    app.use("/api/auth", authRouter)

    app.get("/api/health", (request, response) => {
        const db = mongoose.connection.readyState === mongoose.ConnectionStates.connected
            ? "connected"
            : "disconnected"
        response.json({ status : "ok", db})
    })

    // Return an error if the JSON body is invalid or too large
    app.use((error, request, response, next) => {
        if(error.type === "entity.parse.failed")
        {
            return response.status(400).json({ error : "Invalid JSON body." })
        }
        if(error.type === "entity.too.large")
        {
            return response.status(413).json({ error : "Request body too large." })
        }
        next(error)
    })

    return app
}
