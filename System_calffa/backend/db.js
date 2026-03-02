require('dotenv').config();
const mysql = require('mysql2/promise');

if (!process.env.DB_NAME) {
  console.error('❌ ERROR: DB_NAME is not set in .env file!');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
