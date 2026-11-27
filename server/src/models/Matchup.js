import mongoose from "mongoose"
import { League, LEAGUES } from "../domain/League.js"
import { MATCHUP_STATUSES } from "../domain/MatchupStatus.js"

const matchupSchema = new mongoose.Schema
(
    {
        externalId:
        {
            type : String,
            required : true,
        },
        league:
        {
            type : String,
            enum : LEAGUES,
            default : League.NFL,
            required : true
        },
        season:
        {
            type : Number,
            required : true
        },
        week:
        {
            type : Number,
            required : true
        },
        startTime:
        {
            type : Date,
            required : true
        },
        homeTeam:
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Team",
            required : true
        },
        awayTeam:
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Team",
            required : true
        },
        homeScore:
        {
            type : Number,
            default : null // this accounts for games yet-to-be-played
        },
        awayScore:
        {
            type : Number,
            default : null // this accounts for games yet-to-be-played
        },
        status:
        {
            type : String,
            enum : MATCHUP_STATUSES,
            required : true
        }
    }
)

matchupSchema.index({ league : 1, externalId : 1,}, { unique : true })
matchupSchema.index({ season : 1, week : 1})

export const Matchup = mongoose.model("Matchup", matchupSchema)