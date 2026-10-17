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
    },
    status:{
        type:String,
        enum: ["UPLOADING", "PROCESSING", "READY", "FAILED"],
        default: "UPLOADING"
    },
    fileCount: {
        type: Number,
        default: 0
    }
},{timestamps:true})

const repositoryModel = mongoose.model("Repository",repositorySchema);

export default repositoryModel
