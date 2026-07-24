const auth=require('../../services/auth.service'); const {setFlash}=require('../../middleware/web-auth.middleware');
function loginPage(req,res){if(req.session.user?.role==='PROVIDER')return res.redirect('/provider/dashboard');res.render('provider/login',{title:'Provider login'});}
async function login(req,res){const result=await auth.login(req.body.phone,req.body.password,['PROVIDER']);req.session.user=result.user;setFlash(req,'success','Welcome back.');res.redirect('/provider/dashboard');}
function logout(req,res){req.session.destroy(()=>res.redirect('/provider/login'));} module.exports={loginPage,login,logout};
