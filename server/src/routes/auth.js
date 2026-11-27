import { Router } from "express"
import { User } from "../models/User.js"
import { requireAuth } from "../middleware/auth.js"
import { requireDatabase } from "../middleware/requireDatabase.js"
import { validateRegistration } from "../domain/validateRegistration.js"
import { hashPassword, verifyPassword } from "../services/password.js"
import { createToken } from "../services/token.js"

export const authRouter = Router()

// Register a new user and return their authentication token
authRouter.post("/register", requireDatabase, async (request, response) => {
    const { username, password } = request.body || {}
    // Check that the registration information is valid
    const validationError = validateRegistration(username, password)
    if(validationError)
    {
        return response.status(400).json({ error : validationError })
    }

    const normalizedUsername = username.trim().toLowerCase()
    try
    {
        // Check if the username is already taken
        if(await User.exists({ username : normalizedUsername }))
        {
            return response.status(409).json({ error : "Username is already registered." })
        }

        // Hash the password before storing the user in the database
        const passwordHash = await hashPassword(password)
        const user = new User({ username : normalizedUsername, passwordHash })
        const token = createToken(user.id)
        await user.save()

        // Return the user information and token without the password hash
        return response.status(201).json({
            message : "Account registered successfully.",
            user : { id : user.id, username : user.username },
            token
        })
    }
    catch(error)
    {
        // Handle duplicate usernames if two users register at the same time
        if(error.code === 11000)
        {
            return response.status(409).json({ error : "Username is already registered." })
        }
        return response.status(500).json({ error : "Unable to register account." })
    }
})

// Log the user in and return a token if their credentials are valid
authRouter.post("/login", requireDatabase, async (request, response) => {
    const { username, password } = request.body || {}
    if(typeof username !== "string" || typeof password !== "string" ||
        !username.trim() || !password)
    {
        return response.status(400).json({ error : "Username and password are required." })
    }
    // Reject passwords that exceed the bcrypt byte limit
    if(Buffer.byteLength(password, "utf8") > 72)
    {
        return response.status(400).json({ error : "Password must not exceed 72 UTF-8 bytes." })
    }

    const normalizedUsername = username.trim().toLowerCase()
    try
    {
        // Get the user and include the password hash for verification
        const user = await User.findOne({ username : normalizedUsername }).select("+passwordHash")
        // Return the same error for an incorrect username or password
        if(!user || !(await verifyPassword(password, user.passwordHash)))
        {
            return response.status(401).json({ error : "Invalid username or password." })
        }

        // Create a token after verifying the login credentials
        const token = createToken(user.id)
        return response.status(200).json({
            message : "Login successful.",
            user : { id : user.id, username : user.username },
            token
        })
    }
    catch(error)
    {
        return response.status(500).json({ error : "Unable to log in." })
    }
})

// Get the currently logged in user using their token
authRouter.get("/me", requireDatabase, requireAuth, async (request, response) => {
    try
    {
        // Check that the user still exists in the database
        const user = await User.findById(request.userId)
        if(!user)
        {
            return response.status(401).json({ error : "Authenticated user no longer exists." })
        }

        return response.status(200).json({
            user : { id : user.id, username : user.username }
        })
    }
    catch(error)
    {
        return response.status(500).json({ error : "Unable to retrieve current user." })
    }
})
