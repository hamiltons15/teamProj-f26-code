import mongoose from "mongoose"

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
            default : "nfl",
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
            enum : ["scheduled", "in_progress", "final"],
            required : true
        }
    }
)

matchupSchema.index({ league : 1, externalId : 1,}, { unique : true })
matchupSchema.index({ season : 1, week : 1})

export const Matchup = mongoose.model("Matchup", matchupSchema)