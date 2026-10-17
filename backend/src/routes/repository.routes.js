import express from 'express'
import authMiddleware from './../middlewares/auth.middleware.js';
import { allRepositoryController, createRepository, deleteRepository, updateRepository, uploadRepository, importGithubRepository, repositoryFiles, askRepository } from '../controllers/repository.controller.js';
import upload from '../middlewares/upload.middleware.js';

const repositoryRouter = express.Router();


repositoryRouter.post('/create',authMiddleware,createRepository)
repositoryRouter.get('/getAll',authMiddleware,allRepositoryController)
repositoryRouter.delete('/delete/:id',authMiddleware,deleteRepository)
repositoryRouter.put("/update/:id",authMiddleware,updateRepository)
repositoryRouter.post('/upload/:id',authMiddleware,upload.single('repository'),uploadRepository)
repositoryRouter.post('/github/:id',authMiddleware,importGithubRepository)
repositoryRouter.get('/:id/files',authMiddleware,repositoryFiles)
repositoryRouter.post('/:id/ask',authMiddleware,askRepository)


export default repositoryRouter
