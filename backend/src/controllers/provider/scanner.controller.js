const qr=require('../../services/qr.service'); const {extractToken}=require('../../utils/qr'); const AppError=require('../../utils/AppError');
function scanner(_req,res){res.render('provider/scanner',{title:'QR scanner'});}
async function validate(req,res){const token=extractToken(req.body.token);if(!token)throw new AppError('Enter a valid QR token or Zeere QR link',422,'INVALID_TOKEN');const result=await qr.validate(req.session.user,token,{ip:req.ip,userAgent:req.get('user-agent')});res.json({success:true,message:'QR validated successfully',data:result});}
async function history(req,res){const {query}=require('../../config/database');const rows=await query('SELECT l.*,q.public_token FROM qr_scan_logs l LEFT JOIN participant_qr_codes q ON q.id=l.qr_id WHERE l.scanned_by_user_id=? ORDER BY l.created_at DESC LIMIT 200',[req.session.user.id]);res.render('provider/scan-history',{title:'Scan history',rows});}
module.exports={scanner,validate,history};
