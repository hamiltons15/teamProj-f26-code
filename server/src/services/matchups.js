import { Team } from "../models/Team.js"
import { Matchup } from "../models/Matchup.js"
import { fetchMatchups } from "../sports/espn.js"
import { League } from "../domain/League.js"

const FIRST_WEEK = 1
const REGULAR_SEASON_WEEKS = 18

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

export async function syncSeason(season) {
    let total = 0
    for (let week = FIRST_WEEK; week <= REGULAR_SEASON_WEEKS; week++)
    {
        total += await syncMatchups(season, week)
    }
    return total
}