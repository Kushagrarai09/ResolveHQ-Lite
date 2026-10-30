const mongoose=require("mongoose");
const notificationSchema=new mongoose.Schema({
 recipient:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
 actor:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
 ticket:{type:mongoose.Schema.Types.ObjectId,default:null},
 type:{type:String,enum:["ticket_assigned","ticket_updated","comment_added"],required:true},
 message:{type:String,required:true,maxlength:240},
 readAt:{type:Date,default:null}
},{timestamps:true});
notificationSchema.index({recipient:1,readAt:1,createdAt:-1});
module.exports=mongoose.model("Notification",notificationSchema);
