import express from 'express'

import routes from './routes/auth.routes.js';
import repositoryRouter from './routes/repository.routes.js';
import cookieParser from "cookie-parser"

const app = express();

app.use(express.json())

app.use(cookieParser())

app.use('/api/auth', routes)

app.use('/api/repository', repositoryRouter)

export default app