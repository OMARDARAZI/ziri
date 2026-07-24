const {body}=require('express-validator');
module.exports={ story:[body('title').trim().notEmpty(),body('content').trim().notEmpty(),body('story_time').isISO8601()], event:[body('title').trim().notEmpty(),body('description').trim().notEmpty(),body('event_date').isISO8601()] };
