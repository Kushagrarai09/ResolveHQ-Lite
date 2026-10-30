const Ticket=require("../models/Ticket");
const Comment=require("../models/Comment");
const Activity=require("../models/Activity");
const Notification=require("../models/Notification");
const User=require("../models/User");
const escapeRegex=value=>value.replace(/[.*+?^${}()|[]\\]/g,"\\$&");
const canWorkTeam=user=>["agent","admin"].includes(user.role);
function ticketScope(user){return canWorkTeam(user)?{$or:[{owner:user._id},{assignedTo:user._id}]}:{owner:user._id};}
function logActivity({ticket,actor,changes=[],action="ticket_updated"}){return Activity.create({ticket:ticket._id,actor,action,changes,ticketSnapshot:{title:ticket.title}});}
async function notify({recipient,actor,ticket,type,message}){
 if(!recipient||String(recipient)===String(actor))return;
 await Notification.create({recipient,actor,ticket,type,message});
}
function diff(before,after,fields){
 return fields.filter(k=>String(before[k]??"")!==String(after[k]??""))
  .map(field=>({field,oldValue:before[field]==null?"":String(before[field]),newValue:after[field]==null?"":String(after[field])}));
}
async function create(req,res,next){
 try{
  const ticket=await Ticket.create({
   title:req.body.title,description:req.body.description,priority:req.body.priority||"medium",
   status:"open",category:req.body.category||"general",tags:req.body.tags||[],dueAt:req.body.dueAt||null,owner:req.user._id
  });
  await logActivity({ticket,actor:req.user._id,action:"ticket_created",changes:[
   {field:"title",newValue:ticket.title},{field:"status",newValue:ticket.status},{field:"priority",newValue:ticket.priority}
  ]});
  res.status(201).json({success:true,data:{ticket}});
 }catch(error){next(error);}
}
async function list(req,res,next){
 try{
  const filter=ticketScope(req.user);
  if(req.query.status)filter.status=req.query.status;
  if(req.query.priority)filter.priority=req.query.priority;
  if(req.query.category)filter.category=req.query.category;
  if(req.query.tag)filter.tags=req.query.tag;
  if(req.query.overdue==="true")filter.dueAt={$lt:new Date(),$ne:null};
  if(req.query.search){
   const term=escapeRegex(req.query.search);
   filter.$and=[...(filter.$and||[]),{$or:[{title:{$regex:term,$options:"i"}},{description:{$regex:term,$options:"i"}}]}];
  }
  const page=Math.max(1,Number.parseInt(req.query.page,10)||1);
  const limit=Math.min(50,Math.max(1,Number.parseInt(req.query.limit,10)||10));
  const [tickets,total]=await Promise.all([
   Ticket.find(filter).populate("owner","name email").populate("assignedTo","name email role").sort({createdAt:-1}).skip((page-1)*limit).limit(limit),
   Ticket.countDocuments(filter)
  ]);
  res.json({success:true,data:{tickets,pagination:{total,page,limit,pages:Math.ceil(total/limit)}}});
 }catch(error){next(error);}
}
async function getOne(req,res,next){
 try{
  const ticket=await Ticket.findOne({_id:req.params.id,...ticketScope(req.user)}).populate("owner","name email").populate("assignedTo","name email role");
  if(!ticket)return res.status(404).json({success:false,message:"Ticket not found."});
  res.json({success:true,data:{ticket}});
 }catch(error){next(error);}
}
async function update(req,res,next){
 try{
  const fields=["title","description","status","priority","category","tags","dueAt"];
  const updates={};
  fields.forEach(key=>{if(req.body[key]!==undefined)updates[key]=req.body[key];});
  if(!Object.keys(updates).length)return res.status(400).json({success:false,message:"Provide at least one supported field to update."});
  const ticket=await Ticket.findOne({_id:req.params.id,...ticketScope(req.user)});
  if(!ticket)return res.status(404).json({success:false,message:"Ticket not found."});
  const old=Object.fromEntries(fields.map(key=>[key,ticket[key]]));
  const changes=diff(old,{...old,...updates},fields);
  if(!changes.length)return res.json({success:true,data:{ticket}});
  Object.assign(ticket,updates);await ticket.save();
  await logActivity({ticket,actor:req.user._id,changes});
  await notify({recipient:ticket.owner,actor:req.user._id,ticket:ticket._id,type:"ticket_updated",message:`Ticket "${ticket.title}" was updated.`});
  res.json({success:true,data:{ticket}});
 }catch(error){next(error);}
}
async function assign(req,res,next){
 try{
  const ticket=await Ticket.findOne({_id:req.params.id,...ticketScope(req.user)});
  if(!ticket)return res.status(404).json({success:false,message:"Ticket not found."});
  const assignee=await User.findOne({_id:req.body.assignedTo,role:{$in:["agent","admin"]}}).select("_id name email role");
  if(!assignee)return res.status(400).json({success:false,message:"Assignee must have agent or admin role."});
  const previous=ticket.assignedTo;
  if(String(previous||"")===String(assignee._id))return res.json({success:true,data:{ticket}});
  ticket.assignedTo=assignee._id;await ticket.save();
  await logActivity({ticket,actor:req.user._id,changes:[{field:"assignedTo",oldValue:previous?String(previous):"",newValue:String(assignee._id)}]});
  await notify({recipient:assignee._id,actor:req.user._id,ticket:ticket._id,type:"ticket_assigned",message:`Ticket "${ticket.title}" was assigned to you.`});
  res.json({success:true,data:{ticket:await ticket.populate("assignedTo","name email role")}});
 }catch(error){next(error);}
}
async function remove(req,res,next){
 try{
  const ticket=await Ticket.findOneAndDelete({_id:req.params.id,owner:req.user._id});
  if(!ticket)return res.status(404).json({success:false,message:"Ticket not found."});
  await logActivity({ticket,actor:req.user._id,action:"ticket_deleted"});
  await Comment.deleteMany({ticket:ticket._id});
  res.json({success:true,message:"Ticket and comments deleted. Activity history retained."});
 }catch(error){next(error);}
}
async function listActivity(req,res,next){
 try{
  const ticket=await Ticket.findOne({_id:req.params.id,...ticketScope(req.user)}).select("_id");
  if(!ticket){
   const deletion=await Activity.findOne({ticket:req.params.id,actor:req.user._id,action:"ticket_deleted"}).select("_id");
   if(!deletion)return res.status(404).json({success:false,message:"Ticket not found."});
  }
  const activities=await Activity.find({ticket:req.params.id}).populate("actor","name").sort({createdAt:-1}).limit(100);
  res.json({success:true,data:{activities}});
 }catch(error){next(error);}
}
async function listComments(req,res,next){
 try{
  const ticket=await Ticket.findOne({_id:req.params.id,...ticketScope(req.user)}).select("_id");
  if(!ticket)return res.status(404).json({success:false,message:"Ticket not found."});
  const comments=await Comment.find({ticket:ticket._id}).populate("author","name").sort({createdAt:1});
  res.json({success:true,data:{comments}});
 }catch(error){next(error);}
}
async function addComment(req,res,next){
 try{
  const ticket=await Ticket.findOne({_id:req.params.id,...ticketScope(req.user)});
  if(!ticket)return res.status(404).json({success:false,message:"Ticket not found."});
  const comment=await Comment.create({ticket:ticket._id,author:req.user._id,text:req.body.text});
  await comment.populate("author","name");
  await notify({recipient:ticket.owner,actor:req.user._id,ticket:ticket._id,type:"comment_added",message:`A new comment was added to "${ticket.title}".`});
  res.status(201).json({success:true,data:{comment}});
 }catch(error){next(error);}
}
module.exports={create,list,getOne,update,assign,remove,listActivity,listComments,addComment};
