const auth=require('../../services/auth.service'); const {setFlash}=require('../../middleware/web-auth.middleware');
function loginPage(req,res){ if(req.session.user?.role==='ADMIN') return res.redirect('/admin/dashboard'); res.render('admin/login',{title:'Admin login'}); }
async function login(req,res){ const result=await auth.login(req.body.phone,req.body.password,['ADMIN']); req.session.user=result.user; setFlash(req,'success','Welcome back.'); res.redirect('/admin/dashboard'); }
function logout(req,res){ req.session.destroy(()=>res.redirect('/admin/login')); }
module.exports={loginPage,login,logout};
