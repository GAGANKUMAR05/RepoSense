import express from 'express'

import routes from './routes/auth.routes.js';
import repositoryRouter from './routes/repository.routes.js';
import cookieParser from "cookie-parser"
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const frontendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_ORIGIN || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json())

app.use(cookieParser())

app.use('/api/auth', routes)

app.use('/api/repository', repositoryRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', aiConfigured: Boolean(process.env.OPENAI_API_KEY) }));

app.use(express.static(frontendDirectory));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 400).json({ message: err.message || 'Request failed' });
});

export default app
