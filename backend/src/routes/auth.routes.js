import express from 'express'
import { loginController, logoutController, meController, registerController } from '../controllers/auth.controller.js'
import authMiddleware from './../middlewares/auth.middleware.js';

const routes = express.Router()


routes.post('/register',registerController)
routes.post('/login',loginController)
routes.get('/logout',logoutController)
routes.get('/me',authMiddleware,meController)

export default routes