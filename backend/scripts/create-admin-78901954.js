const bcrypt = require('bcrypt');
const { query, pool } = require('../src/config/database');
const { normalizePhone } = require('../src/utils/phone');

async function main() {
    const fullName = 'Admin';
    const phoneInput = '78901954';
    const password = '123';

    const phone = normalizePhone(phoneInput);
    if (!phone) throw new Error('Invalid phone number');

    const hashedPassword = await bcrypt.hash(password, 12);

    await query(
        `INSERT INTO users (role, full_name, phone, password_hash, is_active) 
         VALUES ('ADMIN', ?, ?, ?, 1) 
         ON DUPLICATE KEY UPDATE 
         full_name = VALUES(full_name), 
         password_hash = VALUES(password_hash), 
         is_active = 1`,
        [fullName, phone, hashedPassword]
    );

    console.log(`Admin account created successfully!`);
    console.log(`Phone: ${phone}`);
    console.log(`Password: ${password}`);

    await pool.end();
}

main().catch(error => {
    console.error('Error creating admin:', error.message);
    process.exitCode = 1;
});
