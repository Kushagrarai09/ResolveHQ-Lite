# ResolveHQ Lite

Node.js, Express, MongoDB/Mongoose and React ticket-support portfolio project.

## Features
- JWT auth; public signup creates user role only
- User, agent and admin roles; admin-only role management
- Ticket create/list/read/update/delete, agent assignment and comments
- Due dates, overdue filter and SLA-oriented dashboard metric
- Categories, tags and title/description search
- In-app notifications, unread counts and mark-as-read actions
- Audit activity history and MongoDB aggregation analytics
- Helmet, CORS allowlist, global and stricter authentication rate limiting
- Swagger/OpenAPI docs

## Roles
Public signup cannot set privileged roles. Create the first admin directly in MongoDB; use the admin-only API to promote agents. Users see their own tickets. Agents/admins see tickets they own or that are assigned to them.

## Run locally
1. Node.js 20+ and MongoDB required.
2. Root: `npm install`
3. Copy `.env.example` to `.env`, set MongoDB URI and a random JWT secret of at least 32 characters.
4. Run `npm run dev`.
5. Frontend: `cd frontend && npm install`, copy frontend env example to .env and run `npm run dev`.
6. API on port 5001; Swagger at `/api-docs`.

## API
- `GET/POST /api/tickets`: list/search/filter/create
- `GET/PATCH/DELETE /api/tickets/:id`: ticket operations
- `PATCH /api/tickets/:id/assignment`: agent/admin assigns to agent/admin
- `GET /api/tickets/:id/activity`: immutable-by-API history
- `GET/POST /api/tickets/:id/comments`: comments
- `GET /api/analytics/overview`: status/priority/overdue counts
- `GET /api/notifications`: list own notifications and unread count
- `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`
- `GET /api/users/agents`, `PATCH /api/users/:id/role`: admin-only
- `POST /api/uploads/tickets/:id/attachments`: currently returns 501 until object storage is configured

Ticket creation/update accepts categories billing, technical, account, bug and general; up to 10 tags (30 chars each); and ISO-8601 dueAt. List filters include status, priority, category, tag, overdue=true, search, page and limit. Search checks title and description using escaped regex.

SLA behavior currently marks a ticket overdue when dueAt is earlier than now and status is not resolved. Business-hour calendars, automatic escalation and resolution-time reports are not implemented.

Notifications are in-app only. Assignment notifies the assignee; updates and comments notify the owner. Users can read only their own notifications.

File upload is deliberately not enabled: the route returns 501 until private durable object storage (S3/Cloudinary), file size limits, MIME signature checks, malware scanning and authorization are configured. Do not save production files on ephemeral hosting disks.

This is a portfolio project, not a security-audited production service. Use demo data only.
