import mongoose from "mongoose"
import { syncSeason } from "../src/services/matchups.js"

const FAILURE_EXIT_CODE = 1

const { MONGODB_URI } = process.env
const season = Number(process.argv[2])   

if(!MONGODB_URI)
{
    console.error("Missing MONGODB_URI. Copy .env.example to .env and fill it in")
    process.exit(FAILURE_EXIT_CODE)
}

if(!season)
{
    console.error("User Error: try 'npm run sync:matchups --workspace server -- <season>'")
    process.exit(FAILURE_EXIT_CODE)
}

await mongoose.connect(MONGODB_URI)

const count = await syncSeason(season)
console.log(`Synced ${count} matchups for ${season}`)

await mongoose.disconnect()

