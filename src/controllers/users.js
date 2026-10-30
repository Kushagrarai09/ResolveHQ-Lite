const User=require("../models/User");
async function listAgents(req,res,next){
 try{
  const agents=await User.find({role:{$in:["agent","admin"]}}).select("_id name email role").sort({name:1});
  res.json({success:true,data:{agents}});
 }catch(error){next(error);}
}
async function setRole(req,res,next){
 try{
  if(String(req.user._id)===req.params.id&&req.body.role!=="admin")return res.status(400).json({success:false,message:"You cannot remove your own admin role."});
  const user=await User.findByIdAndUpdate(req.params.id,{role:req.body.role},{new:true,runValidators:true}).select("_id name email role");
  if(!user)return res.status(404).json({success:false,message:"User not found."});
  res.json({success:true,data:{user}});
 }catch(error){next(error);}
}
module.exports={listAgents,setRole};
