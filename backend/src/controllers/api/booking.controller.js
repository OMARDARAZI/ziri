const service=require('../../services/booking.service'); const {success}=require('../../utils/apiResponse');
async function create(req,res){ const booking=await service.create(req.user,req.body); success(res,booking,'Booking created successfully',201); }
async function list(req,res){ const result=await service.listForCustomer(req.user.id,req.query); success(res,result.items,'Operation completed successfully',200,result.pagination); }
async function get(req,res){ success(res,await service.getForCustomer(req.params.id,req.user.id)); }
async function cancel(req,res){ success(res,await service.cancel(req.params.id,req.user.id),'Booking cancelled successfully'); }
module.exports={create,list,get,cancel};
