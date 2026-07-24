const {body}=require('express-validator');
const register=[body('full_name').trim().isLength({min:2,max:150}).withMessage('Full name is required'),body('phone').trim().notEmpty().withMessage('Phone number is required'),body('password').isLength({min:8}).withMessage('Password must be at least 8 characters'),body('password_confirmation').custom((value,{req})=>value===req.body.password).withMessage('Password confirmation does not match')];
const login=[body('phone').trim().notEmpty().withMessage('Phone number is required'),body('password').notEmpty().withMessage('Password is required')];
module.exports={register,login};
