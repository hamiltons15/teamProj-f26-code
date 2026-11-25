import mongoose from "mongoose"

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
            required : true, 
            default : "nfl"
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