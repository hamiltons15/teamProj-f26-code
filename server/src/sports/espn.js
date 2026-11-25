import { League } from "../domain/League.js"
import { MatchupStatus } from "../domain/MatchupStatus.js"
import { TeamAt } from "../domain/TeamAt.js"

const BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
const TEAMS_DIRECTORY = "teams"
const SCOREBOARD_DIRECTORY = "scoreboard"
const REGULAR_SEASON_TYPE = 2
const COMPETITION_INDEX = 0
const SPORTS_INDEX = 0
const LEAGUE_INDEX = 0

const STATUS_FROM_ESPN = Object.freeze({
    pre: MatchupStatus.SCHEDULED,
    in: MatchupStatus.IN_PROGRESS,
    post: MatchupStatus.FINAL
})

function toTeam(teamFromEspn)
{
    return {
        externalId: teamFromEspn.id,
        league: League.NFL,
        name: teamFromEspn.displayName
    }
}

function toMatchup(event)
{
    const competitors = event.competitions[COMPETITION_INDEX].competitors
    const home = competitors.find(competitor => competitor.homeAway === TeamAt.HOME)
    const away = competitors.find(competitor => competitor.homeAway === TeamAt.AWAY)
    const status = STATUS_FROM_ESPN[event.status.type.state]

    return{
        externalId : event.id,
        league : League.NFL,
        season : event.season.year,
        week : event.week.number,
        startTime : new Date(event.date),
        homeTeamExternalId : home.team.id,
        awayTeamExternalId : away.team.id,
        homeScore : toScore(home.score, status),
        awayScore : toScore(away.score, status),
        status
    }
}

function toScore(score, status){
    return status === MatchupStatus.SCHEDULED ? null : Number(score)
}

export async function fetchTeams()
{
    const url = `${BASE_URL}/${TEAMS_DIRECTORY}`
    const response = await fetch(url)

    if(!response.ok) throw new Error(`ESPN teams request failed: ${response.status}`)

    const body = await response.json()
    return body.sports[SPORTS_INDEX].leagues[LEAGUE_INDEX].teams.map(entry => toTeam(entry.team))
}

export async function fetchMatchups(season, week)
{
    const baseUrl = `${BASE_URL}/${SCOREBOARD_DIRECTORY}`
    const queryFrom = `?dates=${season}`
    const querySelect = `&seasontype=${REGULAR_SEASON_TYPE}&week=${week}`
    const url = `${baseUrl}${queryFrom}${querySelect}`
    
    const response = await fetch(url)

    if(!response.ok) throw new Error(`ESPN scoreboard request failed: ${response.status}`)

    const body = await response.json()
    return body.events.map(toMatchup)
}

