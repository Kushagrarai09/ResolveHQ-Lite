const jwt=require("jsonwebtoken");
const User=require("../models/User");
async function protect(req,res,next){
 try{
  const [scheme,token]=(req.headers.authorization||"").split(" ");
  if(scheme!=="Bearer"||!token)return res.status(401).json({success:false,message:"Authentication required. Send a Bearer token."});
  const payload=jwt.verify(token,process.env.JWT_SECRET);
  const user=await User.findById(payload.userId).select("_id name email role");
  if(!user)return res.status(401).json({success:false,message:"Account not found."});
  req.user=user;next();
 }catch(error){
  if(["JsonWebTokenError","TokenExpiredError","NotBeforeError"].includes(error.name))return res.status(401).json({success:false,message:"Invalid or expired token."});
  next(error);
 }
}
module.exports=protect;
