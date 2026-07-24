const repo=require('../../repositories/offering.repository'); const {success}=require('../../utils/apiResponse'); const AppError=require('../../utils/AppError');
async function list(req,res){ const result=await repo.list(req.query); success(res,result.items,'Operation completed successfully',200,result.pagination); }
async function get(req,res){ const item=await repo.find(req.params.id); if(!item||!item.is_active) throw new AppError('Offering not found',404,'OFFERING_NOT_FOUND'); success(res,item); }
module.exports={list,get};
