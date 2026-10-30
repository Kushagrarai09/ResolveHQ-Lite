const request=require("supertest");
const mongoose=require("mongoose");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const app=require("../src/app");
const User=require("../src/models/User");
const Ticket=require("../src/models/Ticket");
const Notification=require("../src/models/Notification");
let owner,agent,ownerToken,agentToken,otherToken;
beforeAll(async()=>{await mongoose.connect(process.env.MONGODB_URI);});
beforeEach(async()=>{
 await Promise.all(Object.values(mongoose.connection.collections).map(c=>c.deleteMany({})));
 const password=await bcrypt.hash("TestPassword123!",4);
 [owner,agent]=await User.create([
  {name:"Owner",email:"owner@example.test",password,role:"user"},
  {name:"Agent",email:"agent@example.test",password,role:"agent"}
 ]);
 const other=await User.create({name:"Other",email:"other@example.test",password,role:"user"});
 const sign=user=>jwt.sign({userId:user._id},process.env.JWT_SECRET);
 ownerToken=sign(owner);agentToken=sign(agent);otherToken=sign(other);
});
afterAll(async()=>{await mongoose.connection.dropDatabase();await mongoose.disconnect();});
test("analytics are scoped and return zeros for empty accounts",async()=>{
 let res=await request(app).get("/api/analytics/overview").set("Authorization",`Bearer ${ownerToken}`).expect(200);
 expect(res.body.data).toMatchObject({total:0,open:0,inProgress:0,resolved:0,overdue:0,byPriority:{low:0,medium:0,high:0}});
 await Ticket.create([
  {title:"Owned open",description:"x",owner:owner._id,status:"open",priority:"high",dueAt:new Date(Date.now()-60000)},
  {title:"Owned resolved",description:"x",owner:owner._id,status:"resolved",priority:"low"},
  {title:"Private other",description:"x",owner:new mongoose.Types.ObjectId(),status:"open",priority:"medium"}
 ]);
 res=await request(app).get("/api/analytics/overview").set("Authorization",`Bearer ${ownerToken}`).expect(200);
 expect(res.body.data).toMatchObject({total:2,open:1,resolved:1,overdue:1,byPriority:{low:1,medium:0,high:1}});
});
test("only agents/admins can assign and assignee receives a notification",async()=>{
 const ticket=await Ticket.create({title:"Assignment",description:"x",owner:owner._id});
 await request(app).patch(`/api/tickets/${ticket._id}/assignment`).set("Authorization",`Bearer ${ownerToken}`).send({assignedTo:agent._id}).expect(403);
 await request(app).patch(`/api/tickets/${ticket._id}/assignment`).set("Authorization",`Bearer ${agentToken}`).send({assignedTo:agent._id}).expect(200);
 expect(await Notification.countDocuments({recipient:agent._id,type:"ticket_assigned"})).toBe(1);
});
test("notifications are recipient-scoped",async()=>{
 await Notification.create({recipient:owner._id,actor:agent._id,type:"ticket_updated",message:"Ticket changed"});
 const res=await request(app).get("/api/notifications").set("Authorization",`Bearer ${otherToken}`).expect(200);
 expect(res.body.data.notifications).toHaveLength(0);
});
