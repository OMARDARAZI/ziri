const QRCode = require('qrcode'); const { transaction } = require('../config/database'); const AppError = require('../utils/AppError'); const qrRepo=require('../repositories/qr.repository'); const providerRepo=require('../repositories/provider.repository'); const scans=require('../repositories/scan-log.repository'); const { publicUrl }=require('../utils/qr');
function scanError(code,message,status=422){ const error=new AppError(message,status,code); error.scanCode=code; return error; }
async function log(connection, data) { await scans.create(data,connection); }
async function validate(providerUser, token, requestInfo={}) {
  const outcome = await transaction(async (connection) => {
    const provider = await providerRepo.byUserId(providerUser.id, connection);
    const base = { userId: providerUser.id, token, ip: requestInfo.ip, userAgent: requestInfo.userAgent };
    const failed = async (code, message, status = 422, qrId = null) => {
      await log(connection, { ...base, qrId, success: false, code, message });
      return { error: { code, message, status } };
    };
    if (!provider || !provider.is_active || !provider.account_active) return failed('PROVIDER_INACTIVE', 'Provider account is inactive', 403);
    const qr = await qrRepo.findByToken(token, connection, true);
    if (!qr) return failed('INVALID_TOKEN', 'QR token was not found', 404);
    const fail = (code, message, status = 422) => failed(code, message, status, qr.id);
    if (qr.provider_id !== provider.id) return fail('WRONG_PROVIDER', 'This QR code belongs to another provider', 403);
    if (qr.booking_status === 'CANCELLED') return fail('BOOKING_CANCELLED', 'The booking has been cancelled');
    if (qr.booking_status !== 'CONFIRMED') return fail('BOOKING_NOT_CONFIRMED', 'The booking is not confirmed');
    if (qr.status === 'USED') return fail('QR_ALREADY_USED', 'This QR code has already been used');
    if (qr.status === 'CANCELLED') return fail('QR_CANCELLED', 'This QR code has been cancelled');
    const now = new Date();
    if (qr.status === 'EXPIRED' || now > new Date(qr.valid_until)) {
      if (qr.status === 'ACTIVE') await connection.execute("UPDATE participant_qr_codes SET status='EXPIRED',expired_reason='TIME_EXPIRED' WHERE id=?", [qr.id]);
      return fail('QR_EXPIRED', 'This QR code has expired');
    }
    if (now < new Date(qr.valid_from)) return fail('QR_NOT_YET_VALID', 'This QR code is not yet valid');
    if (qr.status !== 'ACTIVE') return fail('QR_INVALID_STATUS', 'This QR code is not active');
    await connection.execute("UPDATE participant_qr_codes SET status='USED',used_at=NOW(),used_by_provider_user_id=?,expired_reason='SCANNED' WHERE id=?", [providerUser.id, qr.id]);
    await log(connection, { ...base, qrId: qr.id, success: true, code: 'VALIDATED', message: 'Participant validated successfully' });
    return { participant: { id: qr.participant_id, full_name: qr.participant_name, phone: qr.participant_phone }, booking: { id: qr.booking_id, booking_code: qr.booking_code, scheduled_at: qr.scheduled_at, offering_title: qr.offering_title, provider_name: qr.provider_name }, qr_status: 'USED' };
  });
  if (outcome.error) throw scanError(outcome.error.code, outcome.error.message, outcome.error.status);
  return outcome;
}
async function publicRecord(token) { const qr=await qrRepo.findByToken(token); if(!qr) return null; if(qr.status==='ACTIVE' && new Date()>new Date(qr.valid_until)) { await require('../config/database').query("UPDATE participant_qr_codes SET status='EXPIRED',expired_reason='TIME_EXPIRED' WHERE id=?",[qr.id]); qr.status='EXPIRED'; qr.expired_reason='TIME_EXPIRED'; } return {...qr, public_url:publicUrl(token)}; }
async function image(token) { const qr=await publicRecord(token); if(!qr) throw new AppError('Invalid QR code',404,'INVALID_QR'); return QRCode.toBuffer(publicUrl(token),{type:'png',width:360,margin:2,errorCorrectionLevel:'M'}); }
module.exports={validate,publicRecord,image};
