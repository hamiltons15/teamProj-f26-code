import { startServer } from "./server.js";
import { startSportsSync } from "./services/sportsSync.js"
import { currentSeason } from "./domain/Season.js"

const DEFAULT_PORT = 3001
const FAILURE_EXIT_CODE = 1

const { PORT = DEFAULT_PORT, MONGODB_URI } = process.env

if(!MONGODB_URI)
{
    console.error("Missing MONGODB_URI. Copy .env.example to .env and fill it in.")
    process.exit(FAILURE_EXIT_CODE)
}

const running = await startServer(
    { 
        port : PORT, 
        mongoUri : MONGODB_URI
    }
)
console.log("MongoDB connected")
console.log(`API listening on port ${running.port}`)

startSportsSync(currentSeason())