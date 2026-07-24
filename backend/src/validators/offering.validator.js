const {body}=require('express-validator');
module.exports={ offering:[body('provider_id').isInt({min:1}),body('type').isIn(['SERVICE','ACTIVITY']),body('title').trim().notEmpty(),body('description').trim().notEmpty(),body('price_usd').isFloat({min:0}),body('price_lbp').isFloat({min:0})] };
