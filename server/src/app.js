import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import teamsRouter from "./routes/teams.js"
import matchupsRouter from "./routes/matchups.js"
import { authRouter } from "./routes/auth.js"
import { HttpStatus } from "./http/status.js"

const BODY_LIMIT = "16kb"

export function createApp(){
    const app = express()
    app.use(cors({ origin : process.env.CLIENT_ORIGIN }))
    app.use(express.json({ limit: BODY_LIMIT }))
    app.use("/api/teams", teamsRouter)
    app.use("/api/matchups", matchupsRouter)

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
            return response.status(HttpStatus.BAD_REQUEST).json({ error : "Invalid JSON body." })
        }
        if(error.type === "entity.too.large")
        {
            return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({ error : "Request body too large." })
        }
        next(error)
    })

    return app
}
