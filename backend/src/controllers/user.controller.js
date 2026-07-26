import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../config/cloudinary.js"
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(async(req,res)=>{

    const {username,email,password,role,phone}=req.body

    if([username,email,password,role,phone].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required") 

    }

    const existedUser =await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exist.")
    }
    console.log(req.files)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required.")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required.")
    }

    const user = await User.create({
        role,
        email,
        password,
        avatar: avatar.url,
        phone,
        username: username.toLowerCase()
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser , "User registered successfully.")
    )
})

const loginUser = asyncHandler( async (req ,res) => {
    const {email,username,password}= req.body

    if (!(username || email)){
        throw new ApiError(400,"username or email is required")
    }

    const user= await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid =await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid user password ")
    }

    const {accessToken, refreshToken} = await genrateAccessandRefreshTokens(user._id)

    // send this token in cookies 
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options ={
        httpOnly: true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )

})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200 , req.user , "Current user fetched successfully")
})

export {
    registerUser,
    loginUser,
    getCurrentUser
}