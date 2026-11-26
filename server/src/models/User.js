import mongoose from "mongoose"

const userSchema = new mongoose.Schema
(
    {
        username:
        {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            minlength : 3,
            maxlength : 30,
            match : /^[a-z0-9_]+$/
        },
        passwordHash:
        {
            type : String,
            required : true,
            select : false
        }
    },
    { timestamps : true }
)

export const User = mongoose.model("User", userSchema)
