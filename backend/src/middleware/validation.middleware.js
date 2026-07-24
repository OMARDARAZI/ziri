const {validationResult}=require('express-validator'); const {failure}=require('../utils/apiResponse');
function validate(req,res,next){ const result=validationResult(req); if(result.isEmpty()) return next(); const errors=result.array().map((item)=>({field:item.path,message:item.msg})); if(req.originalUrl.startsWith('/api/')) return failure(res,'Validation failed',422,errors,'VALIDATION_ERROR'); const error=new Error(errors.map((item)=>item.message).join(', ')); error.statusCode=422; error.code='VALIDATION_ERROR'; return next(error); }
module.exports={validate};
