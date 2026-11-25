import { Team } from "../models/Team.js"
import { Matchup } from "../models/Matchup.js"
import { fetchMatchups } from "../sports/espn.js"
import { League } from "../domain/League.js"

export async function syncMatchups(season, week)
{
    const matchups = await fetchMatchups(season, week)
    
    const teams = await Team.find({ league : League.NFL })
    const teamIdsByExternalId = new Map(teams.map(team => [team.externalId, team._id]))

    const operations = matchups
        .filter(matchup =>
            teamIdsByExternalId.has(matchup.homeTeamExternalId)
            &&
            teamIdsByExternalId.has(matchup.awayTeamExternalId)
        )
        .map(({ homeTeamExternalId, awayTeamExternalId, ...matchup}) => (
            {
                updateOne: 
                {
                    filter:
                    {
                        league : matchup.league,
                        externalId : matchup.externalId
                    },
                    update:
                    {
                        $set:
                        {
                            ...matchup,
                            homeTeam : teamIdsByExternalId.get(homeTeamExternalId),
                            awayTeam : teamIdsByExternalId.get(awayTeamExternalId)
                        }
                    },
                    upsert : true
                }
            }
        ))
    await Matchup.bulkWrite(operations)
    return operations.length
}