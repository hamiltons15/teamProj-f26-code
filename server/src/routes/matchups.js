import { Router } from "express"
import { Matchup } from "../models/Matchup.js"
import { HttpStatus } from "../http/status.js"

const MATCHUP_FIELDS = { _id: 0, externalId: 1, season: 1, week: 1, startTime: 1, homeTeam: 1, awayTeam: 1, homeScore: 1, awayScore: 1, status: 1 }
const TEAM_FIELDS = "-_id externalId name"

const router = Router()

router.get("/", async (request, response) => {
  const season = Number(request.query.season)
  const week = Number(request.query.week)

  if (!Number.isInteger(season) || !Number.isInteger(week)) {
    return response.status(HttpStatus.BAD_REQUEST).json({ error: "season and week must be integers" })
  }

  const matchups = await Matchup.find({ season, week }, MATCHUP_FIELDS)
    .sort({ startTime: 1 })
    .populate("homeTeam", TEAM_FIELDS)
    .populate("awayTeam", TEAM_FIELDS)

  response.json(matchups)
})

export default router