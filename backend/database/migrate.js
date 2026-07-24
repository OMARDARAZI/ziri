const mysql = require('mysql2/promise');
const env = require('../src/config/environment');

const columns = {
  providers: {
    logo: 'VARCHAR(255) NULL',
    cover_image: 'VARCHAR(255) NULL',
    email: 'VARCHAR(190) NULL',
    address: 'VARCHAR(255) NULL',
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  stories: {
    image: "VARCHAR(255) NOT NULL DEFAULT '/images/placeholder.svg'",
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    display_order: 'INT NOT NULL DEFAULT 0',
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  news_articles: {
    image: "VARCHAR(255) NOT NULL DEFAULT '/images/placeholder.svg'",
    published_at: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  safety_tips: {
    image: 'VARCHAR(255) NULL',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    display_order: 'INT NOT NULL DEFAULT 0',
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  weather_updates: {
    condition: "VARCHAR(120) NOT NULL DEFAULT 'Unknown'",
    humidity: 'DECIMAL(5,2) NULL',
    wind_speed: 'DECIMAL(6,2) NULL',
    icon: 'VARCHAR(255) NULL',
    is_active: 'BOOLEAN NOT NULL DEFAULT TRUE',
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  offerings: {
    image: "VARCHAR(255) NOT NULL DEFAULT '/images/placeholder.svg'",
    duration_minutes: 'INT NULL',
    capacity: 'INT NULL',
    location: 'VARCHAR(255) NULL',
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  bookings: {
    participant_count: 'INT NOT NULL DEFAULT 1',
    notes: 'TEXT NULL',
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  booking_participants: {
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  participant_qr_codes: {
    used_at: 'DATETIME NULL',
    used_by_provider_user_id: 'BIGINT UNSIGNED NULL',
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },
  qr_scan_logs: {
    provided_token: "VARCHAR(512) NOT NULL DEFAULT ''",
    result_code: "VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN'",
    result_message: "VARCHAR(255) NOT NULL DEFAULT ''",
    ip_address: 'VARCHAR(64) NULL',
    user_agent: 'VARCHAR(512) NULL'
  },
  app_settings: {
    updated_at: 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  }
};

async function hasColumn(connection, table, column) {
  const [rows] = await connection.execute(
    'SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
    [table, column]
  );
  return rows.length > 0;
}

async function addMissingColumns(connection) {
  const added = new Set();
  for (const [table, tableColumns] of Object.entries(columns)) {
    for (const [column, definition] of Object.entries(tableColumns)) {
      if (await hasColumn(connection, table, column)) continue;
      console.log(`Adding ${table}.${column}`);
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      added.add(`${table}.${column}`);
    }
  }
  return added;
}

async function backfill(connection, added) {
  if (added.has('stories.image') && await hasColumn(connection, 'stories', 'image_url')) {
    await connection.query("UPDATE stories SET image = COALESCE(NULLIF(image_url, ''), image)");
  }
  if (added.has('news_articles.image') && await hasColumn(connection, 'news_articles', 'image_url')) {
    await connection.query("UPDATE news_articles SET image = COALESCE(NULLIF(image_url, ''), image)");
  }

  if (added.has('news_articles.published_at')) {
    await connection.query('UPDATE news_articles SET published_at = created_at');
  }
  if (added.has('bookings.participant_count')) {
    await connection.query(`
      UPDATE bookings b
      LEFT JOIN (
        SELECT booking_id, COUNT(*) AS participant_count
        FROM booking_participants
        GROUP BY booking_id
      ) p ON p.booking_id = b.id
      SET b.participant_count = GREATEST(COALESCE(p.participant_count, 0), 1)
    `);
  }

  if (added.has('participant_qr_codes.used_at') && await hasColumn(connection, 'participant_qr_codes', 'scanned_at')) {
    await connection.query('UPDATE participant_qr_codes SET used_at = COALESCE(used_at, scanned_at)');
  }
  if (added.has('participant_qr_codes.used_by_provider_user_id') && await hasColumn(connection, 'participant_qr_codes', 'scanned_by_provider_user_id')) {
    await connection.query('UPDATE participant_qr_codes SET used_by_provider_user_id = COALESCE(used_by_provider_user_id, scanned_by_provider_user_id)');
  }
  if ((added.has('qr_scan_logs.result_code') || added.has('qr_scan_logs.result_message')) && await hasColumn(connection, 'qr_scan_logs', 'result')) {
    await connection.query("UPDATE qr_scan_logs SET result_code = COALESCE(NULLIF(result, ''), result_code), result_message = COALESCE(NULLIF(result_message, ''), NULLIF(result, ''), result_message)");
  }
  if (added.has('qr_scan_logs.provided_token')) {
    await connection.query(`
      UPDATE qr_scan_logs l
      LEFT JOIN participant_qr_codes q ON q.id = l.qr_id
      SET l.provided_token = COALESCE(q.public_token, l.provided_token)
      WHERE l.provided_token = ''
    `);
  }
}

async function main() {
  const connection = await mysql.createConnection(env.db);
  try {
    const added = await addMissingColumns(connection);
    await backfill(connection, added);
    console.log('Database migration completed.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
