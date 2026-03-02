// create-notifications-table.js
// Run once: node create-notifications-table.js
const pool = require('./db');

async function createNotificationsTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS due_date_notifications (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        farmer_id INT(10) UNSIGNED NOT NULL,
        reference_type ENUM('loan', 'machinery_booking') NOT NULL,
        reference_id INT(11) NOT NULL,
        notification_type ENUM('last_month', 'last_week', '3_days', '2_days', '1_day', 'due_day') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        due_date DATE NOT NULL,
        trigger_date DATE NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
        UNIQUE KEY unique_notification (farmer_id, reference_type, reference_id, notification_type)
      )
    `);
    console.log('✅ due_date_notifications table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating table:', err.message);
    process.exit(1);
  }
}

createNotificationsTable();
