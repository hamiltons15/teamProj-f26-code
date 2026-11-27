import { syncTeams } from "./teams.js"
import { syncSeason } from "./matchups.js"

// MS in a day, therefore the sync will happen daily.
const SYNCHRONIZATION_INTERVAL_MS = 24 * 60 * 60 * 1000

export function startSportsSync(season)
{
    const run = async () => {
        try
        {
            const teams = await syncTeams()
            const matchups = await syncSeason(season)
            console.log(`Season sync complete: ${teams} teams, ${matchups} matchups`)
        }
        catch (error)
        {
            console.error("Synchronization failed.", error.message)
        }
    }
    run()
    return setInterval(run, SYNCHRONIZATION_INTERVAL_MS)
}