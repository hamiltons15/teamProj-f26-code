import { Team } from "../models/Team.js"
import { fetchTeams } from "../sports/espn.js"

export async function syncTeams() {
    const teams = await fetchTeams()

    const operations = teams.map(team => 
        (
            {
                updateOne: 
                {
                    filter: { league: team.league, externalId: team.externalId },
                    update: { $set: team },
                    upsert: true
                }
            }
        )
    )

  await Team.bulkWrite(operations)
  return teams.length
}