const mongoose=require("mongoose");
const ticketSchema=new mongoose.Schema({
 title:{type:String,required:true,trim:true,minlength:3,maxlength:120},
 description:{type:String,required:true,trim:true,maxlength:5000},
 status:{type:String,enum:["open","in_progress","resolved"],default:"open"},
 priority:{type:String,enum:["low","medium","high"],default:"medium"},
 category:{type:String,enum:["billing","technical","account","bug","general"],default:"general",index:true},
 tags:{type:[String],default:[],validate:values=>values.length<=10},
 dueAt:{type:Date,default:null,index:true},
 assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null,index:true},
 owner:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true}
},{timestamps:true});
ticketSchema.index({owner:1,createdAt:-1});
ticketSchema.index({owner:1,status:1,priority:1});
ticketSchema.index({owner:1,category:1,tags:1});
ticketSchema.index({assignedTo:1,status:1});
ticketSchema.index({title:"text",description:"text"});
module.exports=mongoose.model("Ticket",ticketSchema);
