const bcrypt = require('bcrypt');
const { query, transaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const auth = require('../services/auth.service');
const { normalizePhone } = require('../utils/phone');
const { validityWindow } = require('../utils/date');
const { qrValiditySettings } = require('../services/setting.service');
const providerRepo = require('../repositories/provider.repository');
const bookingRepo = require('../repositories/booking.repository');
const { withUrls } = require('../services/booking.service');
const qrService = require('../services/qr.service');
const { publicUrl, extractToken } = require('../utils/qr');
const { limitOffsetClause } = require('../utils/pagination');

const resources = {
  stories: { table: 'stories', fields: ['title','content','story_time','is_active','display_order'], image: 'image', order: 'display_order ASC, story_time DESC', search: 'title' },
  news: { table: 'news_articles', fields: ['title','content','published_at','is_active'], image: 'image', order: 'published_at DESC', search: 'title' },
  events: { table: 'events', fields: ['title','description','event_date','start_time','end_time','location','is_active'], image: 'image', order: 'event_date DESC', search: "CONCAT(title,' ',COALESCE(location,''))" },
  restaurants: { table: 'restaurants', fields: ['name','description','cuisine_type','opening_time','closing_time','location','phone','rating','price_range','menu_items','is_active','display_order'], image: 'image', order: 'display_order ASC, name ASC', search: "CONCAT(name,' ',cuisine_type,' ',COALESCE(location,''))" },
  'safety-tips': { table: 'safety_tips', fields: ['title','content','is_active','display_order'], image: 'image', order: 'display_order ASC', search: 'title' },
  providers: { table: 'providers', fields: ['user_id','business_name','description','phone','email','address','is_active'], images: ['logo','cover_image'], order: 'business_name', search: "CONCAT(business_name,' ',phone)" },
  'provider-users': { table: 'users', fields: ['provider_id','full_name','phone','password','is_active'], where: "role='PROVIDER'", order: 'created_at DESC', providerUser: true, search: "CONCAT(full_name,' ',phone)" },
  offerings: { table: 'offerings', fields: ['provider_id','type','title','description','price_usd','price_lbp','duration_minutes','capacity','location','is_active'], image: 'image', order: 'created_at DESC', search: 'title' },
  customers: { table: 'users', fields: ['full_name','phone','is_active'], where: "role='CUSTOMER'", order: 'created_at DESC', userResource: true, search: "CONCAT(full_name,' ',phone)" },
  users: { table: 'users', fields: ['provider_id','role','full_name','phone','is_active'], order: 'created_at DESC', userResource: true, search: "CONCAT(full_name,' ',phone,' ',role)" },
  bookings: { table: 'bookings', fields: [], order: 'created_at DESC', readonly: true, search: 'booking_code' },
  participants: { table: 'booking_participants', fields: [], order: 'created_at DESC', readonly: true, search: "CONCAT(full_name,' ',phone)" },
  'qr-codes': { table: 'participant_qr_codes', fields: [], order: 'created_at DESC', readonly: true, search: 'public_token' },
  'scan-logs': { table: 'qr_scan_logs', fields: [], order: 'created_at DESC', readonly: true, search: "CONCAT(result_code,' ',result_message)" },
  settings: { table: 'app_settings', fields: ['setting_key','setting_value'], order: 'setting_key', settings: true, search: "CONCAT(setting_key,' ',setting_value)" },
  'privacy-policy': { table: 'app_settings', fields: ['setting_key','setting_value'], order: 'setting_key', settings: true, search: "CONCAT(setting_key,' ',setting_value)" },
  'deletion-requests': { table: 'account_deletion_requests', fields: ['phone','full_name','reason','status'], order: 'created_at DESC', search: "CONCAT(phone,' ',COALESCE(full_name,''),' ',COALESCE(reason,''),' ',status)" }
};
function csrf(req) { if (!req.session.csrfToken) req.session.csrfToken = require('crypto').randomBytes(32).toString('hex'); return req.session.csrfToken; }
function resource(name) { const value = resources[name]; if (!value) throw new AppError('Unknown dashboard resource', 404, 'NOT_FOUND'); return value; }
function number(value, fallback, max = 200) { const parsed = Number.parseInt(String(value || ''), 10); return Number.isFinite(parsed) ? Math.min(max, Math.max(1, parsed)) : fallback; }
function pagination(req) { const page = number(req.query.page, 1); const limit = number(req.query.limit, 20, 100); return { page, limit, offset: (page - 1) * limit }; }
function safeColumns(config) { return config.table === 'users' ? 'id,provider_id,role,full_name,phone,is_active,created_at,updated_at' : '*'; }
function dashboardId(value, field = 'id') { if (!/^[1-9]\d*$/.test(String(value || ''))) throw new AppError(`A valid ${field} is required`,422,'VALIDATION_ERROR'); return Number(value); }
function optionalId(value, field) { return value === undefined || value === '' ? null : dashboardId(value,field); }
function filterSql(req, config) { const clauses = []; const values = []; if (config.where) clauses.push(config.where); const search=String(req.query.search||'').trim(); if (search&&config.search) { clauses.push(`${config.search} LIKE ?`); values.push(`%${search}%`); } if (req.query.status && ['bookings','qr-codes'].includes(req.params.resource)) { const valid=req.params.resource==='bookings'?['PENDING','CONFIRMED','CANCELLED','COMPLETED']:['ACTIVE','USED','EXPIRED','CANCELLED']; if(!valid.includes(req.query.status)) throw new AppError('Invalid status filter',422,'VALIDATION_ERROR'); clauses.push('status=?'); values.push(req.query.status); } if (req.query.is_active !== undefined && ['stories','news','events','restaurants','safety-tips','weather','providers','offerings','customers','provider-users','users'].includes(req.params.resource)) { if(!['true','false','1','0'].includes(String(req.query.is_active))) throw new AppError('Invalid active filter',422,'VALIDATION_ERROR'); clauses.push('is_active=?'); values.push(req.query.is_active === 'true' || req.query.is_active === '1' ? 1 : 0); } if (req.query.type && req.params.resource === 'offerings') { if(!['SERVICE','ACTIVITY'].includes(req.query.type)) throw new AppError('Invalid offering type',422,'VALIDATION_ERROR'); clauses.push('type=?'); values.push(req.query.type); } if (req.query.provider_id && req.params.resource === 'offerings') { clauses.push('provider_id=?'); values.push(dashboardId(req.query.provider_id,'provider ID')); } return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', values }; }
const requiredFields = {
  stories: ['title','content','story_time'], news: ['title','content','published_at'], events: ['title','description','event_date'],
  restaurants: ['name','description','cuisine_type'], 'safety-tips': ['title','content'], weather: ['location','temperature','condition','description','weather_date'],
  providers: ['business_name','phone'], 'provider-users': ['full_name','phone'], customers: ['full_name','phone'], users: ['full_name','phone'],
  offerings: ['provider_id','type','title','description','price_usd','price_lbp']
};
function hasValue(value) { return value !== undefined && value !== null && String(value).trim() !== ''; }
function validateRequired(resourceName, values, creating) { for (const field of requiredFields[resourceName] || []) if ((creating || Object.hasOwn(values,field)) && !hasValue(values[field])) throw new AppError(`${field.replaceAll('_',' ')} is required`,422,'VALIDATION_ERROR'); }
function finiteNumber(value, field, minimum = 0, maximum) { const number=Number(value); if(!Number.isFinite(number)||number<minimum||(maximum!==undefined&&number>maximum)) throw new AppError(`A valid ${field} is required`,422,'VALIDATION_ERROR'); return number; }
function validateDate(value, field) { if(!hasValue(value)||Number.isNaN(Date.parse(String(value)))) throw new AppError(`A valid ${field} is required`,422,'VALIDATION_ERROR'); }
function validateTime(value, field) { if(value!==undefined&&value!==null&&value!==''&&!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(value))) throw new AppError(`A valid ${field} is required`,422,'VALIDATION_ERROR'); }
function normalizeActive(values) { if(values.is_active!==undefined&&values.is_active!==null) values.is_active=['true','1',1,true].includes(values.is_active); }
function validateValues(resourceName, values, creating) {
  validateRequired(resourceName,values,creating); normalizeActive(values);
  for (const field of ['price_usd','price_lbp','temperature','wind_speed']) if(values[field]!==undefined&&values[field]!==null) values[field]=finiteNumber(values[field],field.replaceAll('_',' '));
  if(values.humidity!==undefined&&values.humidity!==null) values.humidity=finiteNumber(values.humidity,'humidity',0,100);
  for (const field of ['duration_minutes','capacity','display_order']) if(values[field]!==undefined&&values[field]!==null) { const value=finiteNumber(values[field],field.replaceAll('_',' ')); if(!Number.isInteger(value)) throw new AppError(`A valid ${field.replaceAll('_',' ')} is required`,422,'VALIDATION_ERROR'); values[field]=value; }
  if(values.story_time!==undefined) validateDate(values.story_time,'story time'); if(values.published_at!==undefined) validateDate(values.published_at,'published date'); if(values.weather_date!==undefined) validateDate(values.weather_date,'weather date'); if(values.event_date!==undefined) validateDate(values.event_date,'event date');
  validateTime(values.start_time,'start time'); validateTime(values.end_time,'end time');
}
async function validateReferences(resourceName, values) {
  const userId=optionalId(values.user_id,'provider user ID'); if(resourceName==='providers'&&userId!==null) { values.user_id=userId; const rows=await query("SELECT id FROM users WHERE id=? AND role='PROVIDER'",[userId]); if(!rows[0]) throw new AppError('Provider profile must use a provider user',422,'VALIDATION_ERROR'); }
  const providerId=optionalId(values.provider_id,'provider ID'); if(resourceName==='offerings'&&providerId!==null) { values.provider_id=providerId; const rows=await query('SELECT id FROM providers WHERE id=?',[providerId]); if(!rows[0]) throw new AppError('Selected provider was not found',422,'VALIDATION_ERROR'); }
}
async function requireProviderProfile(req) { const provider=await providerRepo.byUserId(req.session.user.id); if(!provider) throw new AppError('Your provider profile still needs to be configured by an administrator',403,'PROVIDER_PROFILE_REQUIRED'); return provider; }
async function login(req, res) { const role = req.originalUrl.includes('/provider/login') ? 'PROVIDER' : 'ADMIN'; const result = await auth.login(req.body.phone, req.body.password, [role]); req.session.user = result.user; success(res, { user: result.user, csrf_token: csrf(req) }, 'Login successful'); }
function logout(req, res) { req.session.destroy(() => success(res, {}, 'Logged out successfully')); }
function me(req, res) { success(res, { user: req.session.user, csrf_token: csrf(req) }); }
async function adminSummary(_req,res) {
  const summarySql = `
    SELECT
      (SELECT COUNT(*) FROM users WHERE role='CUSTOMER') AS customers,
      (SELECT COUNT(*) FROM providers) AS providers,
      (SELECT COUNT(*) FROM offerings) AS offerings,
      (SELECT COUNT(*) FROM offerings WHERE type='SERVICE') AS services,
      (SELECT COUNT(*) FROM offerings WHERE type='ACTIVITY') AS activities,
      (SELECT COUNT(*) FROM bookings) AS bookings,
      (SELECT COUNT(*) FROM bookings WHERE status='PENDING') AS pending,
      (SELECT COUNT(*) FROM bookings WHERE status='CONFIRMED') AS confirmed,
      (SELECT COUNT(*) FROM bookings WHERE status='CANCELLED') AS cancelled,
      (SELECT COUNT(*) FROM bookings WHERE status='COMPLETED') AS completed,
      (SELECT COUNT(*) FROM qr_scan_logs WHERE success=1 AND DATE(created_at)=CURDATE()) AS validations,
      (SELECT COUNT(*) FROM events WHERE is_active=1 AND event_date>=CURDATE()) AS events,
      (SELECT COUNT(*) FROM restaurants WHERE is_active=1) AS restaurants
  `;
  const [summaryRows, recentBookings] = await Promise.all([
    query(summarySql),
    query("SELECT b.id, b.booking_code, b.scheduled_at, b.status, b.total_amount, b.currency, u.full_name customer_name, o.title offering_title FROM bookings b JOIN users u ON u.id=b.customer_user_id JOIN offerings o ON o.id=b.offering_id ORDER BY b.created_at DESC LIMIT 5")
  ]);
  const summary = summaryRows[0] || {};
  success(res, { ...summary, recent_bookings: recentBookings });
}
async function related(_req,res) { const [providerUsers,providers] = await Promise.all([query("SELECT id,full_name,phone FROM users WHERE role='PROVIDER' AND is_active=1 ORDER BY full_name"),query('SELECT id,business_name FROM providers WHERE is_active=1 ORDER BY business_name')]); success(res,{provider_users:providerUsers,providers}); }
async function list(req,res) { const config = resource(req.params.resource); const { page, limit, offset } = pagination(req); const filter = filterSql(req, config); const [items,total] = await Promise.all([query(`SELECT ${safeColumns(config)} FROM ${config.table} ${filter.sql} ORDER BY ${config.order} ${limitOffsetClause(limit, offset)}`,filter.values), query(`SELECT COUNT(*) total FROM ${config.table} ${filter.sql}`,filter.values)]); success(res,items,'Operation completed successfully',200,{page,limit,total:total[0].total,pages:Math.ceil(total[0].total/limit)}); }
async function get(req,res) { const config = resource(req.params.resource); const id=config.settings?String(req.params.id||'').trim():dashboardId(req.params.id); if(!id||config.settings&&!/^[A-Za-z0-9_.-]{1,100}$/.test(id)) throw new AppError('A valid setting key is required',422,'VALIDATION_ERROR'); const key=config.settings?'setting_key':'id'; const rows=await query(`SELECT ${safeColumns(config)} FROM ${config.table} WHERE ${key}=?`,[id]); if(!rows[0]) throw new AppError('Record not found',404,'NOT_FOUND'); if(req.params.resource==='bookings'){ const booking=await bookingRepo.find(id); if(!booking) throw new AppError('Record not found',404,'NOT_FOUND'); return success(res,{...booking,participants:withUrls(await bookingRepo.participantRows(id))}); } if(req.params.resource==='qr-codes'){ const item=await qrService.publicRecord(rows[0].public_token); if(!item) throw new AppError('Record not found',404,'NOT_FOUND'); return success(res,item); } success(res,rows[0]); }
function files(req, config, values) { if (config.image && req.file) values[config.image] = `/uploads/${req.file.destination.split(require('path').sep).pop()}/${req.file.filename}`; for (const field of config.images || []) { const file = req.files?.find((entry) => entry.fieldname === field); if (file) values[field] = `/uploads/${file.destination.split(require('path').sep).pop()}/${file.filename}`; } }
async function save(req,res) { const config=resource(req.params.resource); if(config.readonly) throw new AppError('This resource is read only',403,'READ_ONLY'); let id=req.params.id || null; if(id&&!config.settings) id=dashboardId(id); const values={}; for(const field of config.fields) if(!['password','setting_key'].includes(field) && req.body[field] !== undefined) values[field]=req.body[field] === '' ? null : req.body[field]; files(req,config,values); if(config.settings){const key=String(id||req.body.setting_key||'').trim();const settingValue=req.body.setting_value;if(!/^[A-Za-z0-9_.-]{1,100}$/.test(key)||!hasValue(settingValue))throw new AppError('A valid setting key and value are required',422,'VALIDATION_ERROR'); if(id){const result=await query('UPDATE app_settings SET setting_value=? WHERE setting_key=?',[settingValue,key]);if(!result.affectedRows)throw new AppError('Record not found',404,'NOT_FOUND');}else await query('INSERT INTO app_settings (setting_key,setting_value) VALUES (?,?)',[key,settingValue]);return success(res,{setting_key:key,setting_value:settingValue},'Setting saved successfully');} const creating=!id; validateValues(req.params.resource,values,creating); await validateReferences(req.params.resource,values);
  if(config.userResource || config.providerUser || ['users','customers','provider-users'].includes(req.params.resource)){
    if(values.phone!==undefined){
      values.phone=normalizePhone(values.phone);
      if(!values.phone)throw new AppError('Phone number is invalid',422,'VALIDATION_ERROR');
      const existing = await query('SELECT id FROM users WHERE phone=? AND id!=?', [values.phone, id || 0]);
      if(existing[0]) throw new AppError('Phone number is already registered',409,'PHONE_EXISTS');
    }
    if(req.body.role!==undefined && ['CUSTOMER','PROVIDER','ADMIN'].includes(req.body.role)){
      values.role=req.body.role;
    } else if(creating && !values.role){
      values.role=config.providerUser ? 'PROVIDER' : 'CUSTOMER';
    }
    if(req.body.password && String(req.body.password).trim().length>=8){
      values.password_hash=await bcrypt.hash(String(req.body.password).trim(),12);
    } else if(creating){
      if(!req.body.password || String(req.body.password).trim().length<8) throw new AppError('Password must be at least 8 characters',422,'VALIDATION_ERROR');
      values.password_hash=await bcrypt.hash(String(req.body.password).trim(),12);
    }
  }
  if(req.params.resource==='providers'&&values.phone!==undefined){values.phone=normalizePhone(values.phone);if(!values.phone)throw new AppError('Provider phone is invalid',422,'VALIDATION_ERROR');} if(creating&&config.image&&!values[config.image])throw new AppError('An image is required',422,'VALIDATION_ERROR'); if(id){const keys=Object.keys(values);if(!keys.length)throw new AppError('At least one value is required',422,'VALIDATION_ERROR');const result=await query(`UPDATE ${config.table} SET ${keys.map((key)=>`${key}=?`).join(',')} WHERE id=?`,[...keys.map((key)=>values[key]),id]);if(!result.affectedRows)throw new AppError('Record not found',404,'NOT_FOUND');}else{const keys=Object.keys(values);if(!keys.length)throw new AppError('At least one value is required',422,'VALIDATION_ERROR');const result=await query(`INSERT INTO ${config.table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`,keys.map((key)=>values[key]));id=result.insertId;}
  if(config.table==='users'&&id){const userRow=(await query('SELECT role,full_name,phone FROM users WHERE id=?',[id]))[0];if(userRow&&userRow.role==='PROVIDER'){const businessName=String(req.body.business_name||'').trim()||`${userRow.full_name||'Provider'} Place`;await query(`INSERT INTO providers (user_id,business_name,phone,is_active) VALUES (?,?,?,1) ON DUPLICATE KEY UPDATE business_name=VALUES(business_name),phone=VALUES(phone),is_active=1`,[id,businessName,userRow.phone]);}}
  return get({...req,params:{...req.params,id:String(id)}},res); }
async function remove(req,res) { const config=resource(req.params.resource);if(config.readonly||config.settings)throw new AppError('This record cannot be deleted',403,'READ_ONLY');const id=dashboardId(req.params.id);const result=await query(`DELETE FROM ${config.table} WHERE id=?`,[id]);if(!result.affectedRows)throw new AppError('Record not found',404,'NOT_FOUND');success(res,{},'Record deleted successfully'); }
async function bookingAction(req,res) { const id=dashboardId(req.params.id,'booking ID'); const action=String(req.body.action||'');if(!['confirm','cancel'].includes(action))throw new AppError('Unknown booking action',422,'VALIDATION_ERROR'); await transaction(async(conn)=>{const booking=(await conn.execute('SELECT * FROM bookings WHERE id=? FOR UPDATE',[id]))[0][0];if(!booking)throw new AppError('Booking not found',404,'NOT_FOUND');if(action==='confirm'){const setting=await qrValiditySettings();const range=validityWindow(booking.scheduled_at,setting.before,setting.after);await conn.execute("UPDATE bookings SET status='CONFIRMED' WHERE id=?",[id]);await conn.execute("UPDATE participant_qr_codes q JOIN booking_participants p ON p.id=q.participant_id SET q.valid_from=?,q.valid_until=?,q.status=IF(q.status='CANCELLED','CANCELLED','ACTIVE') WHERE p.booking_id=?",[range.validFrom,range.validUntil,id]);}else{await conn.execute("UPDATE bookings SET status='CANCELLED' WHERE id=?",[id]);await conn.execute("UPDATE participant_qr_codes q JOIN booking_participants p ON p.id=q.participant_id SET q.status='CANCELLED',q.expired_reason='BOOKING_CANCELLED' WHERE p.booking_id=? AND q.status='ACTIVE'",[id]);}});success(res,{},'Booking updated successfully'); }
async function cancelQr(req,res){const id=dashboardId(req.params.id,'QR code ID');const rows=await query('SELECT status FROM participant_qr_codes WHERE id=?',[id]);if(!rows[0])throw new AppError('QR code not found',404,'NOT_FOUND');if(rows[0].status!=='ACTIVE')throw new AppError('This QR code cannot be cancelled',422,'QR_NOT_CANCELLABLE');await query("UPDATE participant_qr_codes SET status='CANCELLED',expired_reason='ADMIN_CANCELLED' WHERE id=?",[id]);success(res,{},'QR code cancelled');}
async function providerSummary(req,res){const provider=await requireProviderProfile(req);const [[today],[upcoming],[participants],[successes],[failed]]=await Promise.all([query("SELECT COUNT(*) total FROM bookings b JOIN offerings o ON o.id=b.offering_id WHERE o.provider_id=? AND DATE(b.scheduled_at)=CURDATE()",[provider.id]),query("SELECT COUNT(*) total FROM bookings b JOIN offerings o ON o.id=b.offering_id WHERE o.provider_id=? AND b.scheduled_at>=NOW() AND b.status='CONFIRMED'",[provider.id]),query("SELECT COUNT(*) total FROM booking_participants bp JOIN bookings b ON b.id=bp.booking_id JOIN offerings o ON o.id=b.offering_id WHERE o.provider_id=? AND DATE(b.scheduled_at)=CURDATE()",[provider.id]),query("SELECT COUNT(*) total FROM qr_scan_logs WHERE scanned_by_user_id=? AND success=1 AND DATE(created_at)=CURDATE()",[req.session.user.id]),query("SELECT COUNT(*) total FROM qr_scan_logs WHERE scanned_by_user_id=? AND success=0 AND DATE(created_at)=CURDATE()",[req.session.user.id])]);success(res,{provider,today:today.total,upcoming:upcoming.total,participants:participants.total,successful_validations:successes.total,failed_scans:failed.total});}
async function providerBookings(req,res){const provider=await requireProviderProfile(req);const {page,limit,offset}=pagination(req);const [items,total]=await Promise.all([query(`SELECT b.*,o.title offering_title,o.type offering_type FROM bookings b JOIN offerings o ON o.id=b.offering_id WHERE o.provider_id=? ORDER BY b.scheduled_at DESC ${limitOffsetClause(limit, offset)}`,[provider.id]),query('SELECT COUNT(*) total FROM bookings b JOIN offerings o ON o.id=b.offering_id WHERE o.provider_id=?',[provider.id])]);success(res,items,'Operation completed successfully',200,{page,limit,total:total[0].total,pages:Math.ceil(total[0].total/limit)});}
async function providerBooking(req,res){const provider=await requireProviderProfile(req);const booking=await bookingRepo.find(dashboardId(req.params.id,'booking ID'));if(!booking||booking.provider_id!==provider.id)throw new AppError('Booking not found',404,'NOT_FOUND');success(res,{...booking,participants:withUrls(await bookingRepo.participantRows(booking.id))});}
async function providerHistory(req,res){await requireProviderProfile(req);const rows=await query('SELECT l.*,q.public_token FROM qr_scan_logs l LEFT JOIN participant_qr_codes q ON q.id=l.qr_id WHERE l.scanned_by_user_id=? ORDER BY l.created_at DESC LIMIT 200',[req.session.user.id]);success(res,rows);}
async function providerProfile(req,res){const provider=await requireProviderProfile(req);if(req.method==='GET')return success(res,provider);const businessName=String(req.body.business_name||'').trim();if(!businessName)throw new AppError('Business name is required',422,'VALIDATION_ERROR');const phone=normalizePhone(req.body.phone);if(!phone)throw new AppError('Phone is invalid',422,'VALIDATION_ERROR');await query('UPDATE providers SET business_name=?,description=?,phone=?,email=?,address=? WHERE id=?',[businessName,req.body.description?.trim()||null,phone,req.body.email?.trim()||null,req.body.address?.trim()||null,provider.id]);success(res,await providerRepo.byUserId(req.session.user.id),'Profile updated successfully');}
async function providerValidate(req,res){await requireProviderProfile(req);const token=extractToken(req.body.token);if(!token)throw new AppError('Enter a valid QR token or public QR link',422,'VALIDATION_ERROR');success(res,await qrService.validate(req.session.user,token,{ip:req.ip,userAgent:req.get('user-agent')}),'QR validated successfully');}

async function publicQr(req,res){const record=await qrService.publicRecord(req.params.token);if(!record)throw new AppError('Invalid QR code',404,'NOT_FOUND');let displayStatus=record.status;if(record.status==='ACTIVE'&&new Date()<new Date(record.valid_from))displayStatus='NOT_YET_VALID';success(res,{participant_name:record.participant_name,masked_phone:require('../utils/phone').maskPhone(record.participant_phone),booking_code:record.booking_code,offering_title:record.offering_title,provider_name:record.provider_name,scheduled_at:record.scheduled_at,status:displayStatus,valid_from:record.valid_from,valid_until:record.valid_until,public_url:publicUrl(req.params.token),image_url:`${publicUrl(req.params.token)}/image`});}

async function getPrivacyPolicy(_req, res) {
  const settingRepo = require('../repositories/setting.repository');
  const DEFAULT_PRIVACY_POLICY = `Welcome to Zeera. Your privacy is paramount to us.

1. Information We Collect
We collect minimal personal information including your full name, phone number, and optional profile avatar to process reservation bookings, validate participant QR codes at check-in, and allow providers to confirm service details.

2. How We Use Your Data
Your data is strictly used for facilitating island activity reservations, customer service support, and security authentication. We do not sell, rent, or trade your personal data to third parties.

3. Account Deletion & Rights
You have the right to request the permanent deletion of your account and personal data at any time directly through the Zeera mobile app under Profile Settings, or by submitting your registered phone number on our public deletion portal.

4. Contact & Support
For any privacy inquiries or assistance, please contact us at support@zeera.lb.`;
  const content = (await settingRepo.get('privacy_policy_content')) || DEFAULT_PRIVACY_POLICY;
  success(res, { content }, 'Privacy policy retrieved');
}

async function updatePrivacyPolicy(req, res) {
  const settingRepo = require('../repositories/setting.repository');
  const content = String(req.body.content || '').trim();
  if (!content) throw new AppError('Privacy policy content cannot be empty', 422, 'VALIDATION_ERROR');
  await settingRepo.set('privacy_policy_content', content);
  success(res, { content }, 'Privacy policy updated successfully');
}

module.exports={login,logout,me,adminSummary,related,list,get,save,remove,bookingAction,cancelQr,providerSummary,providerBookings,providerBooking,providerHistory,providerProfile,providerValidate,publicQr,getPrivacyPolicy,updatePrivacyPolicy,resources};

