// The NFL season is named for the year it begins; Jan-Feb is the prior-season's post season.
const SEASON_START_MONTH = 2 // 0 = Jan, 1 = Feb; therefore 3 = March

// This is a consisten means of identifying which season is the current NFL season
export function currentSeason(now = new Date())
{
    const year = now.getFullYear()
    // IDEA: consider the month, if it's later than march, we can assume that the present year is the current NFL season
    return SEASON_START_MONTH > now.getMonth()
        ? year - 1
        : year 
}