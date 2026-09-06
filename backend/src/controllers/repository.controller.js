import repositoryModel from "../model/repository.model.js";
import AdmZip from "adm-zip";
import fs from "fs";

const createRepository = async(req,res)=>{
    try{

        const user = req.user;
        const {name,description} = req.body;

        if(!name)
        {
            return res.status(401).json({
                message: "Please provid valid repository name"
            })
        }
        const repo = await repositoryModel.create({
            name,
            description,
            owner : user._id
        })

        res.status(201).json({
            message:"Repository created successfully",
            repo
        })


    }catch(err){
        console.log("Error occured during repository creation", err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

const allRepositoryController = async(req,res)=>{
    try{


        const id = req.user._id;
        const repositories = await repositoryModel.find({
            owner:id
        })

        res.status(200).json({
            message:"Repository fetched successfully",
            repositories
        })

    }catch(err){
        console.log("Error occured while fetching repositores",err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }

}


const updateRepository = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const repo = await repositoryModel.findOneAndUpdate(
            {
                _id: id,
                owner: req.user._id
            },
            {
                name,
                description
            },
            {
                new: true
            }
        );

        if (!repo) {
            return res.status(404).json({
                message: "Repository not found"
            });
        }

        return res.status(200).json({
            message: "Repository updated successfully",
            repo
        });

    } catch (err) {
        console.log("Error occurred during updating repository", err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};




const deleteRepository = async (req,res)=>{
    try{

        const {id} = req.params
        
        const repo = await repositoryModel.findOneAndDelete({
            _id: id,
            owner: req.user._id
        });

        if (!repo) {
            return res.status(404).json({
                message: "Repository not found"
            });
        }
        
        res.status(200).json({
            message:"Repository deleted successfully",
            repo
        })
    }catch(err){
        console.log("Error occured during delteing repository",err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
    
}

const uploadRepository = async (req,res)=>{

    const file = req.file;
    const {id} = req.params
    
    if(!file)
    {
        return res.status(400).json({
            message:"upload valid file"
        })
    }
    const repo= await repositoryModel.findOne({
        _id: id,
        owner : req.user._id
    })

    if(!repo)
    {
        return res.status(404).json({
            message:"Repository not found"
        })
    }

    const zip = new AdmZip(file.path);

    const extractPath = `./uploads/${repo._id}`;

    zip.extractAllTo(extractPath, true);

}

export{
    createRepository,
    allRepositoryController,
    deleteRepository,
    updateRepository,
    uploadRepository
}