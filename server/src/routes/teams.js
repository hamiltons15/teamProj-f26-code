import { Router } from "express"
import { Team } from "../models/Team.js"

const router = Router()

router.get("/", async (request, response) => 
    {
        const teams = await Team.find(
            {}, 
            {
                _id : 0,
                externalId : 1,
                name : 1
            }
        )
        .sort({ name : 1 })

        response.json(teams)
    }
)

export default router