const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'agriculture_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function updateStatusEnum() {
  try {
    const connection = await pool.getConnection();
    
    console.log('Updating booking status enum to include "In Use"...');
    
    await connection.execute(`
      ALTER TABLE machinery_bookings 
      MODIFY COLUMN status ENUM('Pending', 'Approved', 'In Use', 'Completed', 'Incomplete', 'Rejected', 'Cancelled') 
      DEFAULT 'Pending' 
      NOT NULL
    `);
    
    console.log('✓ Status enum updated successfully');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

updateStatusEnum();
