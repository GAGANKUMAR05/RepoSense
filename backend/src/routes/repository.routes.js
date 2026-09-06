import express from 'express'
import authMiddleware from './../middlewares/auth.middleware.js';
import { allRepositoryController, createRepository,  deleteRepository, updateRepository, uploadRepository } from '../controllers/repository.controller.js';
import upload from '../middlewares/upload.middleware.js';

const repositoryRouter = express.Router();


repositoryRouter.post('/create',authMiddleware,createRepository)
repositoryRouter.get('/getAll',authMiddleware,allRepositoryController)
repositoryRouter.delete('/delete/:id',authMiddleware,deleteRepository)
repositoryRouter.put("/update/:id",authMiddleware,updateRepository)
repositoryRouter.post('/upload/:id',authMiddleware,upload.single('repository'),uploadRepository)


export default repositoryRouter