const Ticket=require("../models/Ticket");
const teamRole=user=>["agent","admin"].includes(user.role);
async function overview(req,res,next){
 try{
  const match=teamRole(req.user)?{$or:[{owner:req.user._id},{assignedTo:req.user._id}]}:{owner:req.user._id};
  const [data]=await Ticket.aggregate([
   {$match:match},
   {$group:{_id:null,total:{$sum:1},
    open:{$sum:{$cond:[{$eq:["$status","open"]},1,0]}},
    inProgress:{$sum:{$cond:[{$eq:["$status","in_progress"]},1,0]}},
    resolved:{$sum:{$cond:[{$eq:["$status","resolved"]},1,0]}},
    low:{$sum:{$cond:[{$eq:["$priority","low"]},1,0]}},
    medium:{$sum:{$cond:[{$eq:["$priority","medium"]},1,0]}},
    high:{$sum:{$cond:[{$eq:["$priority","high"]},1,0]}},
    overdue:{$sum:{$cond:[{$and:[{$ne:["$dueAt",null]},{$lt:["$dueAt","$$NOW"]},{$ne:["$status","resolved"]}]},1,0]}}
   }},
   {$project:{_id:0,total:1,open:1,inProgress:1,resolved:1,overdue:1,byPriority:{low:"$low",medium:"$medium",high:"$high"}}}
  ]);
  res.json({success:true,data:data||{total:0,open:0,inProgress:0,resolved:0,overdue:0,byPriority:{low:0,medium:0,high:0}}});
 }catch(error){next(error);}
}
module.exports={overview};
