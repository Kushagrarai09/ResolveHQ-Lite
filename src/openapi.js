module.exports={
 openapi:"3.0.3",info:{title:"ResolveHQ Lite API",version:"1.3.0",description:"Support ticket API with team workflow, SLA, notifications, audit history and reporting"},
 servers:[{url:"/"}],components:{securitySchemes:{bearerAuth:{type:"http",scheme:"bearer",bearerFormat:"JWT"}}},
 paths:{
 "/health":{get:{summary:"Health",responses:{"200":{description:"Healthy"}}}},
 "/api/auth/register":{post:{summary:"Register standard user",responses:{"201":{description:"Created"}}}},
 "/api/auth/login":{post:{summary:"Login",responses:{"200":{description:"JWT returned"}}}},
 "/api/auth/me":{get:{summary:"Current profile and role",security:[{bearerAuth:[]}],responses:{"200":{description:"Profile"}}}},
 "/api/tickets":{get:{summary:"List/filter/search tickets",security:[{bearerAuth:[]}],responses:{"200":{description:"Tickets"}}},post:{summary:"Create ticket with category/tags/due date",security:[{bearerAuth:[]}],responses:{"201":{description:"Created"}}}},
 "/api/tickets/{id}":{get:{summary:"Get accessible ticket",security:[{bearerAuth:[]}],responses:{"200":{description:"Ticket"}}},patch:{summary:"Update ticket fields",security:[{bearerAuth:[]}],responses:{"200":{description:"Updated"}}},delete:{summary:"Delete owned ticket",security:[{bearerAuth:[]}],responses:{"200":{description:"Deleted"}}}},
 "/api/tickets/{id}/assignment":{patch:{summary:"Agent/admin assign ticket to agent/admin",security:[{bearerAuth:[]}],responses:{"200":{description:"Assigned"},"403":{description:"Forbidden"}}}},
 "/api/tickets/{id}/activity":{get:{summary:"Read ticket audit history",security:[{bearerAuth:[]}],responses:{"200":{description:"Activity"}}}},
 "/api/tickets/{id}/comments":{get:{summary:"List comments",security:[{bearerAuth:[]}],responses:{"200":{description:"Comments"}}},post:{summary:"Add comment",security:[{bearerAuth:[]}],responses:{"201":{description:"Created"}}}},
 "/api/analytics/overview":{get:{summary:"Status, priority and overdue analytics",security:[{bearerAuth:[]}],responses:{"200":{description:"Summary"}}}},
 "/api/notifications":{get:{summary:"List own notifications and unread count",security:[{bearerAuth:[]}],responses:{"200":{description:"Notifications"}}}},
 "/api/notifications/{id}/read":{patch:{summary:"Mark own notification read",security:[{bearerAuth:[]}],responses:{"200":{description:"Updated"}}}},
 "/api/notifications/read-all":{patch:{summary:"Mark all own notifications read",security:[{bearerAuth:[]}],responses:{"200":{description:"Updated"}}}},
 "/api/users/agents":{get:{summary:"Admin list agents",security:[{bearerAuth:[]}],responses:{"200":{description:"Agents"},"403":{description:"Admin only"}}}},
 "/api/users/{id}/role":{patch:{summary:"Admin update user role",security:[{bearerAuth:[]}],responses:{"200":{description:"Updated"},"403":{description:"Admin only"}}}},
 "/api/uploads/tickets/{id}/attachments":{post:{summary:"Reserved until durable object storage is configured",security:[{bearerAuth:[]}],responses:{"501":{description:"Storage is not configured"}}}}
 }};
