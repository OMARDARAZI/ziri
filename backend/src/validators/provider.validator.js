const {body}=require('express-validator'); module.exports={ provider:[body('business_name').trim().notEmpty(),body('phone').trim().notEmpty()] };
