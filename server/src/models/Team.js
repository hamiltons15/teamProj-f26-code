import mongoose from "mongoose"
import { League, LEAGUES } from "../domain/League.js"

const teamSchema = new mongoose.Schema
(
    {
        externalId: 
        { 
            type : String, 
            required : true
        },
        league:
        {
            type : String,
            enum : LEAGUES,
            default : League.NFL,
            required : true
        },
        name:
        {
            type : String,
            required : true
        }
    }
)

teamSchema.index
(
    {
        league : 1,
        externalId : 1
    },
    {
        unique : true
    }
)

export const Team = mongoose.model("Team", teamSchema)