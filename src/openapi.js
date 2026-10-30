module.exports = {
  openapi: "3.0.3",
  info: { title: "ResolveHQ Lite API", version: "1.2.0", description: "Support ticket REST API with activity history and dashboard analytics" },
  servers: [{ url: "/", description: "Current server" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/health": { get: { summary: "Health check", responses: { "200": { description: "API is healthy" } } } },
    "/api/auth/register": { post: { summary: "Register", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "email", "password"], properties: { name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8 } } } } } }, responses: { "201": { description: "Created" }, "400": { description: "Validation error" }, "409": { description: "Email already exists" } } } },
    "/api/auth/login": { post: { summary: "Login", responses: { "200": { description: "JWT returned" }, "401": { description: "Invalid credentials" } } } },
    "/api/auth/me": { get: { summary: "Current profile", security: [{ bearerAuth: [] }], responses: { "200": { description: "Current user" } } } },
    "/api/tickets": {
      get: { summary: "List, filter, search and paginate tickets", security: [{ bearerAuth: [] }], parameters: [{ in: "query", name: "status", schema: { type: "string", enum: ["open", "in_progress", "resolved"] } }, { in: "query", name: "priority", schema: { type: "string", enum: ["low", "medium", "high"] } }, { in: "query", name: "search", schema: { type: "string" } }, { in: "query", name: "page", schema: { type: "integer" } }, { in: "query", name: "limit", schema: { type: "integer", maximum: 50 } }], responses: { "200": { description: "Ticket list" } },
      post: { summary: "Create ticket and record an activity event", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "description"], properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high"] } } } } } }, responses: { "201": { description: "Created" }, "400": { description: "Validation error" } } }
    },
    "/api/tickets/{id}": { parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], get: { summary: "Get ticket", security: [{ bearerAuth: [] }], responses: { "200": { description: "Ticket" }, "404": { description: "Not found" } } }, patch: { summary: "Update ticket and record changed fields", security: [{ bearerAuth: [] }], responses: { "200": { description: "Updated" }, "400": { description: "Validation error" } } }, delete: { summary: "Delete ticket and comments but retain activity history", security: [{ bearerAuth: [] }], responses: { "200": { description: "Deleted; activity retained" } } } },
    "/api/tickets/{id}/activity": { get: { summary: "Read-only activity history for an owned ticket", security: [{ bearerAuth: [] }], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { "200": { description: "Latest 100 activity records, newest first" }, "404": { description: "Ticket not found or not accessible" } } } },
    "/api/analytics/overview": {
      get: {
        summary: "Get the authenticated user's ticket dashboard summary",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Ticket counts by status and priority",
            content: { "application/json": { schema: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                data: {
                  type: "object",
                  properties: {
                    total: { type: "integer", example: 24 },
                    open: { type: "integer", example: 10 },
                    inProgress: { type: "integer", example: 6 },
                    resolved: { type: "integer", example: 8 },
                    byPriority: { type: "object", properties: {
                      low: { type: "integer", example: 5 },
                      medium: { type: "integer", example: 12 },
                      high: { type: "integer", example: 7 }
                    } }
                  }
                }
              }
            } } }
          },
          "401": { description: "Authentication required" }
        }
      }
    },
    "/api/tickets/{id}/comments": { parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], get: { summary: "List comments", security: [{ bearerAuth: [] }], responses: { "200": { description: "Comments" } } }, post: { summary: "Add comment", security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } } }
  }
};
