const providers=require('../../repositories/provider.repository'); const offerings=require('../../repositories/offering.repository'); const {success}=require('../../utils/apiResponse'); const AppError=require('../../utils/AppError');
async function list(req,res){ const result=await providers.list(req.query); success(res,result.items,'Operation completed successfully',200,result.pagination); }
async function get(req,res){ const provider=await providers.find(req.params.id); if(!provider||!provider.is_active||!provider.account_active) throw new AppError('Provider not found',404,'PROVIDER_NOT_FOUND'); const result=await offerings.list({...req.query,provider_id:provider.id}); success(res,{...provider,offerings:result.items,offerings_pagination:result.pagination}); }
module.exports={list,get};
