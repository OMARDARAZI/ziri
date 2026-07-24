const repo=require('../../repositories/content.repository'); const {success}=require('../../utils/apiResponse'); const mapping={stories:'stories',news:'news',events:'events','safety-tips':'safetyTips',weather:'weather'};
async function list(req,res){ const result=await repo.list(mapping[req.params.resource],req.query); success(res,result.items,'Operation completed successfully',200,result.pagination); }
async function get(req,res){ const item=await repo.find(mapping[req.params.resource],req.params.id); if(!item||!item.is_active) return res.status(404).json({success:false,message:'Content was not found',code:'NOT_FOUND'}); success(res,item); }
module.exports={list,get};
