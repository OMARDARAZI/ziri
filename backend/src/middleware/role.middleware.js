const AppError=require('../utils/AppError');
const allowRoles=(...roles)=>(req,_res,next)=>{ if(!req.user||!roles.includes(req.user.role)) return next(new AppError('You are not authorized for this action',403,'FORBIDDEN')); next(); };
module.exports={allowRoles};
