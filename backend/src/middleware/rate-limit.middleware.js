const rateLimit=require('express-rate-limit');
const jsonMessage=(message)=>(req,res)=>res.status(429).json({success:false,message,code:'RATE_LIMITED'});
const authLimiter=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:true,legacyHeaders:false,handler:jsonMessage('Too many authentication attempts. Please try again later.')});
const qrLimiter=rateLimit({windowMs:60*1000,limit:30,standardHeaders:true,legacyHeaders:false,handler:jsonMessage('Too many QR validation attempts. Please try again shortly.')});
module.exports={authLimiter,qrLimiter};
