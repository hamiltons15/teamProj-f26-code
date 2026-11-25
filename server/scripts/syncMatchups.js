import mongoose from "mongoose"
import { syncMatchups } from "../src/services/matchups.js"

const FAILURE_EXIT_CODE = 1
const FIRST_WEEK = 1
const REGULAR_SEASON_WEEKS = 18

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

for (let week = FIRST_WEEK; week <= REGULAR_SEASON_WEEKS; week++)
{
    const count = await syncMatchups(season, week)
    console.log(`Week ${week}: synced ${count} matchups`)
}

await mongoose.disconnect()

