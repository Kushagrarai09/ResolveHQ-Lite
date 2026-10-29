module.exports = {
  openapi: "3.0.3",
  info: { title: "ResolveHQ Lite API", version: "1.0.0", description: "Support ticket management REST API" },
  servers: [{ url: "/", description: "Current server" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/health": { get: { summary: "Health check", responses: { "200": { description: "API is healthy" } } } },
    "/api/auth/register": { post: { summary: "Register", requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "email", "password"], properties: { name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8 } } } } } }, responses: { "201": { description: "Created" }, "400": { description: "Validation error" }, "409": { description: "Email already exists" } } } },
    "/api/auth/login": { post: { summary: "Login", responses: { "200": { description: "JWT returned" }, "401": { description: "Invalid credentials" } } } },
    "/api/auth/me": { get: { summary: "Current profile", security: [{ bearerAuth: [] }], responses: { "200": { description: "Current user" } } } },
    "/api/tickets": {
      get: { summary: "List, filter, search and paginate tickets", security: [{ bearerAuth: [] }], parameters: [{ in: "query", name: "status", schema: { type: "string", enum: ["open", "in_progress", "resolved"] } }, { in: "query", name: "priority", schema: { type: "string", enum: ["low", "medium", "high"] } }, { in: "query", name: "search", schema: { type: "string" } }, { in: "query", name: "page", schema: { type: "integer" } }, { in: "query", name: "limit", schema: { type: "integer", maximum: 50 } }], responses: { "200": { description: "Ticket list" } } },
      post: { summary: "Create ticket", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "description"], properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high"] } } } } } }, responses: { "201": { description: "Created" }, "400": { description: "Validation error" } } }
    },
    "/api/tickets/{id}": { parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], get: { summary: "Get ticket", security: [{ bearerAuth: [] }], responses: { "200": { description: "Ticket" }, "404": { description: "Not found" } } }, patch: { summary: "Update ticket", security: [{ bearerAuth: [] }], responses: { "200": { description: "Updated" }, "400": { description: "Validation error" } } }, delete: { summary: "Delete ticket and comments", security: [{ bearerAuth: [] }], responses: { "200": { description: "Deleted" } } } },
    "/api/tickets/{id}/comments": { parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], get: { summary: "List comments", security: [{ bearerAuth: [] }], responses: { "200": { description: "Comments" } } }, post: { summary: "Add comment", security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } } }
  }
};
