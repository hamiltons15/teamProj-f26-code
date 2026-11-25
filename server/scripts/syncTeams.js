import mongoose from "mongoose"
import { syncTeams } from "../src/services/teams.js"

const FAILURE_EXIT_CODE = 1

const { MONGODB_URI } = process.env

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Copy .env.example to .env and fill it in.")
  process.exit(FAILURE_EXIT_CODE)
}

await mongoose.connect(MONGODB_URI)
const count = await syncTeams()
console.log(`Synced ${count} teams`)
await mongoose.disconnect()