# ResolveHQ Lite

A full-stack support-ticket management portfolio project built with **Node.js, Express, MongoDB, Mongoose, and React**. It focuses on practical backend fundamentals.

## Features

- Register, login, and view your profile (bcrypt password hashing + JWT)
- Create, list, view, update, and delete support tickets
- Status: `open`, `in_progress`, `resolved`; priority: `low`, `medium`, `high`
- Add and read comments on your own tickets
- **Ticket activity history (audit log):** records creation, field changes (old/new values), and deletion
- Activity history is read-only through the API and retained after ticket deletion
- **Dashboard analytics API:** aggregated ticket totals by status and priority for the authenticated user
- Search by title; filter by status/priority; pagination
- Request validation, centralized errors, security headers, basic API rate limiting
- Ticket ownership enforced in database queries
- OpenAPI/Swagger UI at `/api-docs`
- Postman collection included
- Frontend built with React + Vite

## Requirements

- Node.js 20+ (LTS recommended)
- MongoDB Community Server running locally or MongoDB Atlas

## Run locally

1. From the project root: `npm install`
2. Copy `.env.example` to `.env` and configure `MONGODB_URI` and a strong `JWT_SECRET`.
3. Start the API: `npm run dev`
4. In another terminal: `cd frontend && npm install`
5. Copy `frontend/.env.example` to `frontend/.env`, then run `npm run dev`.
6. Open `http://localhost:5173`. API: `http://localhost:5001`; Swagger: `http://localhost:5001/api-docs`.

Keep environment files private; never commit real credentials.

## API endpoints

All routes below except health and API docs require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api-docs` | Swagger UI |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current profile |
| POST | `/api/tickets` | Create ticket and record activity |
| GET | `/api/tickets` | List/search/filter/paginate tickets |
| GET | `/api/tickets/:id` | Get an owned ticket |
| PATCH | `/api/tickets/:id` | Update an owned ticket and record changes |
| DELETE | `/api/tickets/:id` | Delete ticket/comments; retain audit history |
| GET | `/api/tickets/:id/activity` | Read latest 100 activity records |
| GET | `/api/analytics/overview` | Ticket totals by status and priority for the current user |
| GET | `/api/tickets/:id/comments` | List comments |
| POST | `/api/tickets/:id/comments` | Add comment |

### Dashboard analytics API

```http
GET /api/analytics/overview
Authorization: Bearer <JWT>
```

Example response:

```json
{
  "success": true,
  "data": {
    "total": 24,
    "open": 10,
    "inProgress": 6,
    "resolved": 8,
    "byPriority": {
      "low": 5,
      "medium": 12,
      "high": 7
    }
  }
}
```

The endpoint uses a MongoDB aggregation pipeline with an initial owner filter, so users receive analytics only for their own tickets. It returns zero counts when the user has no tickets and always includes all supported status and priority keys.

### Activity history API

```http
GET /api/tickets/:id/activity
Authorization: Bearer <JWT>
```

Events are `ticket_created`, `ticket_updated`, and `ticket_deleted`. The endpoint returns at most 100 records, newest first. There are no API routes to modify or delete activity records. The activity record stores the ticket ObjectId without a cascading Ticket reference, so it survives ticket deletion. A deleted ticket's history can be read only by the user recorded on its deletion event. Database administrators can still modify the underlying MongoDB collection; this is append-only at the application API layer, not tamper-proof storage.

## Deployment

Use MongoDB Atlas for the database, Render Web Service for the API, and Render Static Site for the React frontend. Configure `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and frontend `VITE_API_URL` in the hosting dashboard. Never commit secrets. See the deployment settings and provider documentation for current plan limits.

## Postman

Import `postman/ResolveHQ-Lite.postman_collection.json`. Set `baseUrl`, `token`, and `ticketId` collection variables.

## Portfolio verification checklist

- [ ] Fresh-clone local setup works
- [ ] Swagger and Postman requests work
- [ ] Ticket create/update/delete activity events are persisted
- [ ] Status and priority changes include old/new values
- [ ] No-op updates do not create unnecessary events
- [ ] Other users cannot read a ticket's activity
- [ ] Deleted ticket history remains readable by its original owner
- [ ] Analytics totals match the user's tickets by status and priority
- [ ] A user with no tickets receives zero counts for every metric
- [ ] Users cannot view another user's analytics
- [ ] No update/delete activity endpoints exist
- [ ] Two-user ownership checks pass

This is a learning/portfolio project, not a security-audited production service. Use demo data only.
