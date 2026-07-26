import { ApiError } from "./ApiError.js"
import { User } from "../models/user.model.js"

const genrateAccessandRefreshTokens = async (userId) =>{
    try {
        const user= await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        // console.log(error);
        throw new ApiError(500, "something went wrong while generating refresh and access token.")
    }
}

export {
    genrateAccessandRefreshTokens
}