import bcrypt from "bcrypt"

const SALT_ROUNDS = 10

// Hash the password using bcrypt before storing it
export async function hashPassword(password)
{
    return bcrypt.hash(password, SALT_ROUNDS)
}

// Compare the entered password with the stored password hash
export async function verifyPassword(password, passwordHash)
{
    return bcrypt.compare(password, passwordHash)
}
