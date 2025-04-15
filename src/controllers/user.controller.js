import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" 
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async(userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating Access and Refresh Token")
    }
}


const registerUser = asyncHandler(async(req,res) => {
    // res.status(200).json({
    //     message : "OK"
    // })


    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName,username,email,password} = req.body
    // console.log("email : ",email)
    

// validation - not empty
    if(
        [fullName ,email ,username , password].some((field) => field?.trim() == "")
    ) {
        throw new ApiError(400 , "All fields are required")
    }


// check if user already exists: username, email
    const existedUser = await User.findOne({
        $or : [{username} , {email}]
    })
    
    if(existedUser){
        throw new ApiError(409,"user with email or username already exist")
    }


// check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400, " Avatar File is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, " Avatar File is required")
    }


// create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),

    })

// remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500," Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser, "User Registered Successfully")
    )

})

const loginUser = asyncHandler(async(req,res) => {

    //bring data using req.body 
    //username or email
    //find the user
    //password check
    //access Token and refreshToken generation
    //send cookie

    //bring data using req.body 
    const {email,username,password} = req.body

    //username or email
    if(!(username || email)){
        throw new ApiError(400, "Username or password is required")
    }

    //find the user
    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist " )
    }

    //password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User credentials")
    }


    //access Token and refreshToken generation

    const{accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInuser = await User.findById(user._id).select("-password,-refreshToken")


    //send cookie
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInuser , accessToken , refreshToken
            },
            "User loggedIn successfully"
        )   
    )


})

const logoutUser = asyncHandler(async(req,res) => {
    // used the verifyJWT mdlwr from "auth.middleware.js" to get the user using refreshToken
    //from which we extracted the _id with help of which we logged out

    User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {refreshToken : undefined}
        },
        {
            new: true
        }
    )


    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,"","User logged out successfully")
    )
})


const refreshAccessToken = asyncHandler(async(req,res) => {
     
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401,"Refresh Token is Invalid")
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,"refreshToken":newRefreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refreshToken") 
    }

})


export  {registerUser,loginUser,logoutUser,refreshAccessToken}