import repositoryModel from "../model/repository.model.js";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import repositoryModel from "../model/repository.model.js"
import fileModel from "../model/file.model.js";

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





const uploadRepository = async (req, res) => {

    let repo;

    try {

        // 1. Get uploaded file
        const file = req.file;

        // 2. Get repository ID from URL
        const { id } = req.params;


        // 3. Check whether file was uploaded
        if (!file) {
            return res.status(400).json({
                message: "Please upload a valid file"
            });
        }


        // 4. Find repository and verify ownership
        repo = await repositoryModel.findOne({
            _id: id,
            owner: req.user._id
        });


        // 5. Repository doesn't exist or doesn't belong to user
        if (!repo) {
            return res.status(404).json({
                message: "Repository not found"
            });
        }


        // 6. Change repository status
        repo.status = "PROCESSING";
        await repo.save();


        // 7. Open the uploaded ZIP file
        const zip = new AdmZip(file.path);


        // 8. Create extraction path
        const extractPath = `./uploads/${repo._id}`;


        // 9. Extract ZIP contents
        zip.extractAllTo(extractPath, true);


        // 10. Function to recursively find files
        const getFiles = (directory) => {

            const entries = fs.readdirSync(directory, {
                withFileTypes: true
            });

            let files = [];


            for (const entry of entries) {

                const fullPath = path.join(directory, entry.name);


                if (entry.isDirectory()) {

                    const nestedFiles = getFiles(fullPath);

                    files = files.concat(nestedFiles);

                } else {

                    files.push(fullPath);

                }
            }


            return files;
        };


        // 11. Get all extracted files
        const allFiles = getFiles(extractPath);


        // 12. Ignore unnecessary files/folders
        const ignored = [
            "node_modules",
            ".git",
            "dist",
            ".env"
        ];


        const usefulFiles = allFiles.filter((filePath) => {

            return !ignored.some((item) =>
                filePath.includes(`${path.sep}${item}${path.sep}`) ||
                filePath.endsWith(`${path.sep}${item}`)
            );

        });


        // 13. Read the contents of every useful file
        const filesData = usefulFiles.map((filePath) => {

            const content = fs.readFileSync(filePath, "utf-8");

            return {
                path: filePath,
                content: content
            };

        });


        // 14. Save files in MongoDB
        const savedFiles = await fileModel.insertMany(
            filesData.map((file) => ({

                repository: repo._id,

                path: file.path,

                filename: path.basename(file.path),

                language: path.extname(file.path).slice(1),

                content: file.content

            }))
        );


        // 15. Repository processing completed
        repo.status = "READY";
        await repo.save();


        // 16. Send success response
        return res.status(201).json({

            message: "Repository uploaded successfully",

            totalFiles: savedFiles.length

        });


    } catch (err) {

        console.error("Repository upload error:", err);


        // Mark repository as failed
        if (repo) {

            repo.status = "FAILED";

            await repo.save();

        }


        return res.status(500).json({

            message: "Failed to process repository"

        });

    }

};







export{
    createRepository,
    allRepositoryController,
    deleteRepository,
    updateRepository,
    uploadRepository
}