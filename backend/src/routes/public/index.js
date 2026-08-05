const router=require('express').Router();
const controller=require('../../controllers/public/qr.controller');
const privacyController=require('../../controllers/public/privacy-delete.controller');
const asyncHandler=require('../../utils/asyncHandler');

router.get('/qr/:token/image',asyncHandler(controller.image));
router.get('/qr/:token',asyncHandler(controller.page));

router.get('/privacy-policy',asyncHandler(privacyController.privacyPolicyPage));
router.get('/delete-account',asyncHandler(privacyController.deleteAccountPage));
router.post('/delete-account',asyncHandler(privacyController.processDeleteAccountRequest));

module.exports=router;
