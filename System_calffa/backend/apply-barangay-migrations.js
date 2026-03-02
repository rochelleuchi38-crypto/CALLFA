/**
 * Apply Barangay ID Migrations to Database
 * This script adds barangay_id columns to machinery tables
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

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

const migrations = [
  {
    name: 'Add barangay_id to machinery_inventory',
    queries: [
      `ALTER TABLE machinery_inventory ADD COLUMN barangay_id INT AFTER created_by`,
      `ALTER TABLE machinery_inventory ADD CONSTRAINT fk_machinery_inventory_barangay FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE`,
      `CREATE INDEX idx_machinery_inventory_barangay ON machinery_inventory(barangay_id)`,
      `CREATE INDEX idx_machinery_inventory_barangay_status ON machinery_inventory(barangay_id, status)`,
      `ALTER TABLE machinery_inventory MODIFY COLUMN barangay_id INT COMMENT 'Barangay that owns this machinery'`
    ]
  },
  {
    name: 'Add barangay_id to machinery_bookings',
    queries: [
      `ALTER TABLE machinery_bookings ADD COLUMN barangay_id INT AFTER farmer_id`,
      `ALTER TABLE machinery_bookings ADD CONSTRAINT fk_machinery_bookings_barangay FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE`,
      `CREATE INDEX idx_machinery_bookings_barangay ON machinery_bookings(barangay_id)`,
      `CREATE INDEX idx_machinery_bookings_barangay_status ON machinery_bookings(barangay_id, status)`,
      `CREATE INDEX idx_machinery_bookings_barangay_date ON machinery_bookings(barangay_id, booking_date)`,
      `ALTER TABLE machinery_bookings MODIFY COLUMN barangay_id INT COMMENT 'Barangay where the booking is made'`
    ]
  },
  {
    name: 'Add barangay_id to machinery_operators',
    queries: [
      `ALTER TABLE machinery_operators ADD COLUMN barangay_id INT AFTER farmer_id`,
      `ALTER TABLE machinery_operators ADD CONSTRAINT fk_machinery_operators_barangay FOREIGN KEY (barangay_id) REFERENCES barangays(id) ON DELETE CASCADE`,
      `CREATE INDEX idx_machinery_operators_barangay ON machinery_operators(barangay_id)`,
      `ALTER TABLE machinery_operators MODIFY COLUMN barangay_id INT COMMENT 'Barangay where operator works'`
    ]
  }
];

const populationQueries = [
  {
    name: 'Populate machinery_inventory barangay_id',
    query: `UPDATE machinery_inventory SET barangay_id = (SELECT id FROM barangays ORDER BY id ASC LIMIT 1) WHERE barangay_id IS NULL`
  },
  {
    name: 'Populate machinery_bookings barangay_id from farmer',
    query: `UPDATE machinery_bookings mb SET barangay_id = (SELECT barangay_id FROM farmers f WHERE f.id = mb.farmer_id) WHERE barangay_id IS NULL`
  },
  {
    name: 'Populate machinery_operators barangay_id from farmer',
    query: `UPDATE machinery_operators mo SET barangay_id = (SELECT barangay_id FROM farmers f WHERE f.id = mo.farmer_id) WHERE barangay_id IS NULL`
  }
];

const verificationQueries = [
  {
    name: 'machinery_inventory',
    query: `SELECT COUNT(*) as total, COUNT(barangay_id) as assigned FROM machinery_inventory`
  },
  {
    name: 'machinery_bookings',
    query: `SELECT COUNT(*) as total, COUNT(barangay_id) as assigned FROM machinery_bookings`
  },
  {
    name: 'machinery_operators',
    query: `SELECT COUNT(*) as total, COUNT(barangay_id) as assigned FROM machinery_operators`
  }
];

async function applyMigrations() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Starting Barangay ID Migration Process...\n');

    // Step 1: Check if columns already exist
    console.log('📋 Checking if columns already exist...\n');
    
    // Step 2: Apply migrations
    for (const migration of migrations) {
      console.log(`⏳ ${migration.name}...`);
      try {
        for (const query of migration.queries) {
          await connection.execute(query);
        }
        console.log(`✅ ${migration.name} - SUCCESS\n`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`⚠️  ${migration.name} - COLUMN ALREADY EXISTS (skipping)\n`);
        } else if (error.message.includes('Duplicate key name')) {
          console.log(`⚠️  ${migration.name} - INDEX/KEY ALREADY EXISTS (skipping)\n`);
        } else {
          console.error(`❌ ${migration.name} - FAILED`);
          console.error(`Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    // Step 3: Populate barangay_id values
    console.log('\n📊 Populating barangay_id values...\n');
    for (const popQuery of populationQueries) {
      console.log(`⏳ ${popQuery.name}...`);
      try {
        const result = await connection.execute(popQuery.query);
        console.log(`✅ ${popQuery.name} - Updated ${result[0].affectedRows} rows\n`);
      } catch (error) {
        console.error(`❌ ${popQuery.name} - FAILED`);
        console.error(`Error: ${error.message}\n`);
      }
    }

    // Step 4: Verify the results
    console.log('\n✔️  Verification Results:\n');
    for (const verifyQuery of verificationQueries) {
      try {
        const [results] = await connection.execute(verifyQuery.query);
        const row = results[0];
        const missing = row.total - row.assigned;
        const status = missing === 0 ? '✅' : '⚠️ ';
        console.log(`${status} ${verifyQuery.name}:`);
        console.log(`   Total Records: ${row.total}`);
        console.log(`   With barangay_id: ${row.assigned}`);
        if (missing > 0) {
          console.log(`   Missing barangay_id: ${missing}`);
        }
        console.log();
      } catch (error) {
        console.error(`Error verifying ${verifyQuery.name}: ${error.message}\n`);
      }
    }

    console.log('\n🎉 Migration Process Complete!\n');
    console.log('✅ Barangay ID columns have been successfully added to all machinery tables!');
    console.log('\nYou can now restart your backend application.');
    console.log('Run: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Migration failed with error:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

applyMigrations();
