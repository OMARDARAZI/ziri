const db = require('../../config/database');
const settingRepo = require('../../repositories/setting.repository');
const userRepo = require('../../repositories/user.repository');
const deletionRepo = require('../../repositories/deletion-request.repository');
const tokenService = require('../../services/token.service');
const { normalizePhone } = require('../../utils/phone');

const DEFAULT_PRIVACY_POLICY = `Welcome to Zeera. Your privacy is paramount to us.

1. Information We Collect
We collect minimal personal information including your full name, phone number, and optional profile avatar to process reservation bookings, validate participant QR codes at check-in, and allow providers to confirm service details.

2. How We Use Your Data
Your data is strictly used for facilitating island activity reservations, customer service support, and security authentication. We do not sell, rent, or trade your personal data to third parties.

3. Account Deletion & Rights
You have the right to request the permanent deletion of your account and personal data at any time directly through the Zeera mobile app under Profile Settings, or by submitting your registered phone number on our public deletion portal.

4. Contact & Support
For any privacy inquiries or assistance, please contact us at support@zeera.lb.`;

async function privacyPolicyPage(req, res) {
  const content = (await settingRepo.get('privacy_policy_content')) || DEFAULT_PRIVACY_POLICY;
  res.render('public/privacy-policy', {
    title: 'Privacy Policy',
    content
  });
}

async function deleteAccountPage(req, res) {
  res.render('public/delete-account', {
    title: 'Account Deletion Request',
    submitted: false,
    error: null
  });
}

async function processDeleteAccountRequest(req, res) {
  const rawPhone = String(req.body.phone || '').trim();
  const phone = normalizePhone(rawPhone);

  if (!phone) {
    return res.status(422).render('public/delete-account', {
      title: 'Account Deletion Request',
      submitted: false,
      error: 'Please enter a valid Lebanese phone number (e.g. +961 70 123 456).'
    });
  }

  const user = await userRepo.findByPhone(phone);
  if (user) {
    await userRepo.deactivate(user.id);
    await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ?', [user.id]);
    await deletionRepo.createRequest({
      userId: user.id,
      phone: user.phone,
      fullName: user.full_name,
      reason: req.body.reason || 'Public web request'
    });
  } else {
    await deletionRepo.createRequest({
      phone: rawPhone,
      reason: req.body.reason || 'Public web request (Unregistered)'
    });
  }

  return res.render('public/delete-account', {
    title: 'Account Deletion Request',
    submitted: true,
    phone: rawPhone,
    error: null
  });
}

module.exports = {
  privacyPolicyPage,
  deleteAccountPage,
  processDeleteAccountRequest
};
