import { Router } from "express"
import { User } from "../models/User.js"
import { requireDatabase } from "../middleware/requireDatabase.js"
import { validateRegistration } from "../domain/validateRegistration.js"
import { hashPassword, verifyPassword } from "../services/password.js"
import { createToken } from "../services/token.js"

export const authRouter = Router()

authRouter.post("/register", requireDatabase, async (request, response) => {
    const { username, password } = request.body || {}
    const validationError = validateRegistration(username, password)
    if(validationError)
    {
        return response.status(400).json({ error : validationError })
    }

    const normalizedUsername = username.trim().toLowerCase()
    try
    {
        if(await User.exists({ username : normalizedUsername }))
        {
            return response.status(409).json({ error : "Username is already registered." })
        }

        const passwordHash = await hashPassword(password)
        const user = new User({ username : normalizedUsername, passwordHash })
        const token = createToken(user.id)
        await user.save()

        return response.status(201).json({
            message : "Account registered successfully.",
            user : { id : user.id, username : user.username },
            token
        })
    }
    catch(error)
    {
        if(error.code === 11000)
        {
            return response.status(409).json({ error : "Username is already registered." })
        }
        return response.status(500).json({ error : "Unable to register account." })
    }
})

authRouter.post("/login", requireDatabase, async (request, response) => {
    const { username, password } = request.body || {}
    if(typeof username !== "string" || typeof password !== "string" ||
        !username.trim() || !password)
    {
        return response.status(400).json({ error : "Username and password are required." })
    }
    if(Buffer.byteLength(password, "utf8") > 72)
    {
        return response.status(400).json({ error : "Password must not exceed 72 UTF-8 bytes." })
    }

    const normalizedUsername = username.trim().toLowerCase()
    try
    {
        const user = await User.findOne({ username : normalizedUsername }).select("+passwordHash")
        if(!user || !(await verifyPassword(password, user.passwordHash)))
        {
            return response.status(401).json({ error : "Invalid username or password." })
        }

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
