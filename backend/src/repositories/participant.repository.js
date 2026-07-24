const db = require('../config/database');
async function findForBooking(participantId, bookingId) { const rows = await db.query('SELECT * FROM booking_participants WHERE id=? AND booking_id=?', [participantId, bookingId]); return rows[0] || null; }
module.exports = { findForBooking };
