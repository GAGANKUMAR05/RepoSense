import mongoose from "mongoose"

const fileSchema = mongoose.Schema({
    repository: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Repository",
        required: true
    },
    path:{
        type:String,
        required:true
    },
    filename:{
        type:String,
        required:true
    },
    language:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    }

})

const fileModel = mongoose.model("File",fileSchema);

export default fileModel;
