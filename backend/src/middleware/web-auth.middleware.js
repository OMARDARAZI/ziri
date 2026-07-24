const AppError=require('../utils/AppError');
function sessionUser(req,res,next){ res.locals.webUser=req.session.user||null; res.locals.flash=req.session.flash||null; delete req.session.flash; next(); }
function requireWebRole(...roles){ return (req,res,next)=>{ if(!req.session.user) return res.redirect(roles.includes('ADMIN')?'/admin/login':'/provider/login'); if(!roles.includes(req.session.user.role)) return next(new AppError('You are not authorized to access this page',403,'FORBIDDEN')); next(); }; }
function setFlash(req,type,message){ req.session.flash={type,message}; }
module.exports={sessionUser,requireWebRole,setFlash};
