// Check that the username and password meet the registration requirements
export function validateRegistration(username, password)
{
    if(typeof username !== "string" || typeof password !== "string")
    {
        return "Username and password are required."
    }

    // Remove extra spaces and convert the username to lowercase
    const normalizedUsername = username.trim().toLowerCase()
    if(!/^[a-z0-9_]{3,30}$/.test(normalizedUsername))
    {
        return "Username must be 3 to 30 characters and contain only letters, numbers, or underscores."
    }
    if([...password].length < 8)
    {
        return "Password must be at least 8 characters."
    }
    // Bcrypt only uses the first 72 bytes of a password
    if(Buffer.byteLength(password, "utf8") > 72)
    {
        return "Password must not exceed 72 UTF-8 bytes."
    }
    return null
}
