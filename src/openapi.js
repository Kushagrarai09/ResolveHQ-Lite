module.exports={openapi:"3.0.3",info:{title:"ResolveHQ Lite API",version:"1.3.0",description:"Support ticket management API"},servers:[{url:"/"}],components:{securitySchemes:{bearerAuth:{type:"http",scheme:"bearer",bearerFormat:"JWT"}}},paths:{
"/health":{get:{summary:"Health check",responses:{"200":{description:"Healthy"}}}},
"/api/analytics/overview":{get:{summary:"Authenticated ticket analytics",security:[{bearerAuth:[]}],responses:{"200":{description:"Ticket totals by status and priority"}}}},
"/api/tickets/{id}/assign":{patch:{summary:"Assign/unassign a ticket (owner only)",security:[{bearerAuth:[]}],parameters:[{in:"path",name:"id",required:true,schema:{type:"string"}}],requestBody:{required:true,content:{"application/json":{schema:{type:"object",properties:{assignedTo:{type:"string",nullable:true}}}}}},responses:{"200":{description:"Assignment updated"},"400":{description:"Invalid agent"}}}},
"/api/sla/summary":{get:{summary:"Overdue and next-24-hour ticket counts",security:[{bearerAuth:[]}],responses:{"200":{description:"SLA summary"}}}},
"/api/notifications":{get:{summary:"List current user's notifications and unread count",security:[{bearerAuth:[]}],responses:{"200":{description:"Notifications"}}}},
"/api/notifications/{id}/read":{patch:{summary:"Mark own notification as read",security:[{bearerAuth:[]}],responses:{"200":{description:"Read"}}}},
"/api/team/agents":{get:{summary:"List assignable agents/admins",security:[{bearerAuth:[]}],responses:{"200":{description:"Agents"}}}},
"/api/team/users/{id}/role":{patch:{summary:"Change role (admin only)",security:[{bearerAuth:[]}],responses:{"200":{description:"Role updated"},"403":{description:"Forbidden"}}}},
"/api/files/tickets/{id}/attachments":{post:{summary:"Upload JPEG/PNG/PDF/TXT up to 5 MB",security:[{bearerAuth:[]}],responses:{"201":{description:"Uploaded"},"413":{description:"File too large"}}},get:{summary:"List ticket attachments",security:[{bearerAuth:[]}],responses:{"200":{description:"Attachments"}}}},
"/api/files/attachments/{attachmentId}/download":{get:{summary:"Authenticated attachment download",security:[{bearerAuth:[]}],responses:{"200":{description:"Download"}}}}
}};