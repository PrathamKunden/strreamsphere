import mongoose,{Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

//brcypt  : is to hash the passwords
//jwt     : is used to generate accessTokens and refreshTokens

const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true ,
            lowercase : true,
            trim : true,
            index : true,
        },
        email : {
            type : String,
            required : true,
            unique : true ,
            lowercase : true,
            trim : true,
        },
        fullName : {
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar : {
            type : String , //independent platform se Url
            required : true,
        },
        coverImage : {
            type : String , //independent platform se Url
        },
        watchHistory : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video",
            }
        ],
        password : {
            type : String,
            required : [true, " Password is required"]
        },
        refreshToken : {
            type : String,
        }
    },
    {
        timestamps : true
    }
)


// pre middleware to encrypt the password before saving in into db
userSchema.pre("save" ,async function (next) {

    if(!this.isModified("password")) {
        return next()
    }
    this.password = await bcrypt.hash(this.password,10)
    next()
})



//Creating custom methods

//here when we need to compare the entered password is correct or not during login we use bcrypt.compare() ,which returns true/false

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password)
}

//here method to generate accessToken and refressToken
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username : this.username,
            fullName : this.fullName
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}




export const User = mongoose.model("User",userSchema)