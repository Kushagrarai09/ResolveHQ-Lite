# ResolveHQ Lite

A full-stack support-ticket management portfolio project built with **Node.js, Express, MongoDB, Mongoose, and React**. It is intentionally focused on core backend fundamentals rather than complex infrastructure.

## Features

- Register, login, and view your profile (bcrypt password hashing + JWT)
- Create, list, view, update, and delete support tickets
- Status: `open`, `in_progress`, `resolved`; priority: `low`, `medium`, `high`
- Add and read comments on your own tickets
- Search by title; filter by status/priority; pagination
- Request validation, centralized errors, security headers, basic API rate limiting
- Ticket ownership enforced in database queries
- OpenAPI/Swagger UI at `/api-docs`
- Postman collection included
- Frontend built with React + Vite

## Requirements

- Node.js 20+ (LTS recommended)
- MongoDB Community Server running locally **or** a MongoDB Atlas database
- Git (optional) and Postman (optional)

## Run locally (Windows / VS Code)

1. Extract this project and open the `resolvehq-showcase` folder in VS Code.
2. In the root terminal, install backend dependencies:

   ```powershell
   npm install
   Copy-Item .env.example .env
   ```

3. Edit `.env`. For local MongoDB, keep `MONGODB_URI=mongodb://127.0.0.1:27017/resolvehq_lite`. Replace `JWT_SECRET` with a long random value. Ensure the MongoDB server/service is running. If using Atlas, paste your Atlas connection string into `MONGODB_URI`.
4. Start the API:

   ```powershell
   npm run dev
   ```

   API: http://localhost:5001  | Health: http://localhost:5001/health  | Swagger: http://localhost:5001/api-docs

5. Open a second terminal and start the React app:

   ```powershell
   cd frontend
   npm install
   Copy-Item .env.example .env
   npm run dev
   ```

6. Open http://localhost:5173, create an account, then create tickets and comments.

If `Copy-Item` says the file already exists, do not overwrite it; open the existing `.env` and check its values. Keep `.env` files private and never commit them.

## Environment variables

### Backend root `.env`

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5001; hosting platforms may set this automatically) |
| `MONGODB_URI` | Local or Atlas MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs; keep private |
| `JWT_EXPIRES_IN` | Token lifetime (default `1d`) |
| `CLIENT_URL` | Frontend origin allowed by CORS, e.g. `http://localhost:5173` |

### `frontend/.env`

`VITE_API_URL=http://localhost:5001/api` is the local API base URL. This is a public frontend setting, not a secret.

## API endpoints

Base URL: `http://localhost:5001`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/api-docs` | No | Swagger UI |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Bearer token | Current profile |
| POST | `/api/tickets` | Bearer token | Create ticket |
| GET | `/api/tickets` | Bearer token | List/search/filter tickets |
| GET | `/api/tickets/:id` | Bearer token | Get an owned ticket |
| PATCH | `/api/tickets/:id` | Bearer token | Update an owned ticket |
| DELETE | `/api/tickets/:id` | Bearer token | Delete an owned ticket and comments |
| GET | `/api/tickets/:id/comments` | Bearer token | List comments |
| POST | `/api/tickets/:id/comments` | Bearer token | Add comment |

List query examples: `/api/tickets?status=open&priority=high&search=password&page=1&limit=10` (limit is capped at 50).

## Deploy (free-tier options may change)

Deployment is split into three parts: **MongoDB Atlas** (database), **Render Web Service** (API), and **Render Static Site** (React frontend). Check each provider's current pricing and free-tier limits before deploying.

### A. Push to GitHub

Create a new empty GitHub repository, then from this project root:

```powershell
git init
git add .
git commit -m "Build ResolveHQ Lite full-stack ticket app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/resolvehq-showcase.git
git push -u origin main
```

Confirm `.env` and `frontend/.env` are not staged. Never publish real credentials.

### B. Create MongoDB Atlas database

1. Create a MongoDB Atlas project and cluster.
2. Create a dedicated database user and strong password.
3. Add network access for your deployment. For a learning deployment where the host's outbound IP is not fixed, `0.0.0.0/0` may be necessary, but it allows connection attempts from any IP; use a strong password and least-privilege DB user. Restrict access where possible.
4. Select **Connect → Drivers → Node.js** and copy the connection string. Replace the placeholders and URL-encode special characters in the password if needed.
5. Use a database name such as `resolvehq_lite` in the URI.

### C. Deploy backend API on Render

1. In Render, choose **New → Web Service** and connect the GitHub repository.
2. Set **Root Directory** to blank (project root), **Build Command** to `npm install`, and **Start Command** to `npm start`.
3. Add environment variables in Render (never in Git):
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your Atlas URI
   - `JWT_SECRET` = a newly generated, strong random secret
   - `JWT_EXPIRES_IN` = `1d`
   - `CLIENT_URL` = the deployed frontend URL (you can update this after step D)
4. Deploy. Check logs, then open `https://YOUR-API.onrender.com/health` and `/api-docs`.

### D. Deploy frontend on Render Static Site

1. In Render choose **New → Static Site**, connect the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable `VITE_API_URL=https://YOUR-API.onrender.com/api` before building.
6. Deploy and copy the static site's URL.
7. Return to the backend Web Service environment settings and set `CLIENT_URL` to the exact frontend URL (no trailing slash), then redeploy the API.

### E. Verify the deployed app

- Open the frontend URL and register a fresh demo account.
- Create a ticket, update its status, add a comment, and delete a test ticket.
- Open API `/health` and `/api-docs`.
- If browser requests fail, check the browser console and Render logs; confirm `CLIENT_URL` exactly matches the frontend origin and `VITE_API_URL` points to the API.
- If MongoDB fails to connect, check Atlas credentials, network access, and the URI.

## Postman

Import `postman/ResolveHQ-Lite.postman_collection.json`. Set the collection variables `baseUrl`, `token`, and `ticketId`. Register or log in, copy `data.token` to `token`, then create a ticket and copy its `_id` to `ticketId` for single-ticket/comment requests.

## Portfolio checklist

- [ ] Public GitHub repository with a clear README
- [ ] Local setup tested from a fresh clone
- [ ] Swagger and Postman requests work
- [ ] Register/login, ticket CRUD, filters, and comments tested
- [ ] Two-user ownership test: user B cannot access user A's ticket
- [ ] Live API and frontend URLs in README/portfolio
- [ ] Short screen recording of the app and Swagger

## Scope and security notes

This is a learning/portfolio project, not a security-audited production service. JWT is stored in browser local storage for simplicity; for a real production system consider secure, HttpOnly cookies, CSRF protections where relevant, stronger operational monitoring, automated integration tests, and a security review. Never use real customer data in a public demo.
