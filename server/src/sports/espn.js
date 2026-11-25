import { League } from "../domain/League.js"

const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
const TEAMS_DIRECTORY = "teams"
const SPORTS_INDEX = 0
const LEAGUE_INDEX = 0

export async function fetchTeams()
{
    const response = await fetch(`${BASE_URL}/${TEAMS_DIRECTORY}`)

    if(!response.ok) throw new Error(`ESPN teams request failed: ${response.status}`)

    const body = await response.json()
    return body.sports[SPORTS_INDEX].leagues[LEAGUE_INDEX].teams.map(entry => toTeam(entry.team))
}

function toTeam(teamFromEspn)
{
    return {
        externalId: teamFromEspn.id,
        league: League.NFL,
        name: teamFromEspn.displayName
    }
}