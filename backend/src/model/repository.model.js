import mongoose from "mongoose"

const repositorySchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true
    }
},{timestamps:true})

const repositoryModel = mongoose.model("Repository",repositorySchema);

export default repositoryModel