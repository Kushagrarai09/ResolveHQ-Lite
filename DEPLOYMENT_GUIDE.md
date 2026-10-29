# ResolveHQ Lite — Deployment Guide

Deployment uses GitHub for source control, MongoDB Atlas for the database, Render Web Service for the Express API, and Render Static Site for the React frontend. Provider plans and free-tier availability can change; check current pricing before deploying.

## 1. Push to GitHub

From the project root:

```powershell
git init
git add .
git status
git commit -m "Build ResolveHQ Lite full-stack ticket app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/resolvehq-showcase.git
git push -u origin main
```

Before committing, confirm neither `.env` nor `frontend/.env` is staged. The `.gitignore` should exclude them. Do not commit credentials.

## 2. Create MongoDB Atlas database

1. Create an Atlas project and cluster.
2. Create a dedicated database user with a strong password.
3. Configure Network Access for your app. Prefer a restricted IP range where feasible. For a learning deployment with a host whose outbound IP is not fixed, `0.0.0.0/0` may be necessary, but it permits connection attempts from any IP; use a strong dedicated DB password and least-privilege permissions.
4. Choose Connect → Drivers → Node.js and copy the connection string.
5. Replace placeholders with your cluster/user/password and include database name `resolvehq_lite`. URL-encode special characters in the password if needed.

## 3. Deploy the API on Render

1. Create a **Web Service** and connect the GitHub repository.
2. Root Directory: leave blank (repository root).
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add these environment variables in Render:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | A newly generated random secret of at least 32 characters |
| `JWT_EXPIRES_IN` | `1d` |
| `CLIENT_URL` | `http://localhost:5173` initially; update after frontend deployment |

6. Deploy and check logs. Verify `https://YOUR-API.onrender.com/health` and `https://YOUR-API.onrender.com/api-docs`.

## 4. Deploy the frontend on Render Static Site

1. Create a **Static Site** from the same GitHub repository.
2. Root Directory: `frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add environment variable before build:

   `VITE_API_URL=https://YOUR-API.onrender.com/api`

6. Deploy and copy the static-site URL.
7. Return to the API Web Service's environment settings. Set `CLIENT_URL` to the exact frontend origin, e.g. `https://YOUR-FRONTEND.onrender.com` (no trailing slash), and redeploy the API.

## 5. Verify end-to-end

- Open the frontend URL and register a fresh demo account.
- Create a ticket, change its status, add a comment, edit and delete a test ticket.
- Check `/health` and `/api-docs` on the API URL.
- If the browser reports CORS errors, ensure `CLIENT_URL` exactly matches the frontend origin and redeploy the API.
- If database connection fails, inspect Atlas URI, credentials, and network access. Do not paste secrets into public issues or chat.

## Local setup quick reference

Backend terminal (project root):

```powershell
npm install
Copy-Item .env.example .env
# Edit .env; set MONGODB_URI and a JWT_SECRET of 32+ characters
npm run dev
```

Frontend terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. Backend health: `http://localhost:5001/health`. Swagger: `http://localhost:5001/api-docs`.
