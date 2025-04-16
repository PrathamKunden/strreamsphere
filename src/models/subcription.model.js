import mongoose,{Schema} from "mongoose"
import { User } from "./user.model"

const subcriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId,  //one who is subcribing
        ref : "User"
    },
    channel :{
        type : Schema.Types.ObjectId,  //one to whom subcriber is subcribing
        ref : "User"
    }
},{timestamps})




export const subcription = mongoose.model("subcription",subcriptionSchema)