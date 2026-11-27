import mongoose from "mongoose"

// Define what is stored in the database for each user
const userSchema = new mongoose.Schema
(
    {
        // Require a unique username and store it in lowercase
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
        // Store the hashed password and exclude it from queries by default
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
