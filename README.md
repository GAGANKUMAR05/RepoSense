# RepoSense

RepoSense lets you import a codebase, browse its indexed source files, and ask questions about its structure, behavior, errors, and implementation choices. The frontend lives in `frontend/`; the Express and MongoDB API lives in `backend/`.

## Run locally

1. Install Node.js and MongoDB (local or hosted).
2. In `backend/`, copy `.env.example` to `.env` and set `MONGODB_URI` and a long random `JWT_SECRET_KEY`.
3. Optional: set `OPENAI_API_KEY` to generate answers grounded in relevant source files. `OPENAI_MODEL` defaults to `gpt-4o-mini`; `OPENAI_BASE_URL` can point to an OpenAI-compatible chat completions endpoint. Without a key, RepoSense still indexes repositories and finds relevant files, but does not generate AI answers.
4. Run `npm install` and `npm run dev` from `backend/`.
5. Open <http://localhost:3000>.

## Import and privacy

Create an account, then import a public GitHub repository URL or upload a ZIP archive (up to 25 MB). ZIP uploads are limited to source and documentation files; GitHub imports index at most 200 eligible text files. Private GitHub access is not configured. Each repository and its indexed files are scoped to its owner. The backend stores indexed text in MongoDB and extracts ZIPs under `backend/uploads/`.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/auth/logout`
- `GET /api/repository/getAll`, `POST /api/repository/create`
- `POST /api/repository/github/:id`, `POST /api/repository/upload/:id`
- `GET /api/repository/:id/files`, `POST /api/repository/:id/ask`
- `PUT /api/repository/update/:id`, `DELETE /api/repository/delete/:id`
- `GET /api/health`

Authentication uses an HTTP-only session cookie. For a separate frontend origin, set `FRONTEND_ORIGIN` to that origin; the default is the same-origin local app.
