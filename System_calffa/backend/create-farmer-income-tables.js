// Migration: Create farmer income tables
// Run: node create-farmer-income-tables.js

const pool = require('./db');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('🌾 Creating farmer income tables...\n');

    // Main income records table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS farmer_income_records (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        farmer_id INT UNSIGNED NOT NULL,
        area_hectares DECIMAL(10,2) NOT NULL,
        planting_method ENUM('sabog', 'talok') NOT NULL,
        irrigation_type VARCHAR(50) NOT NULL,

        -- Labor & other expenses
        land_preparation_cost DECIMAL(12,2) DEFAULT 0,
        planting_cost DECIMAL(12,2) DEFAULT 0,
        spraying_cost DECIMAL(12,2) DEFAULT 0,
        harvester_cost DECIMAL(12,2) DEFAULT 0,
        drying_cost DECIMAL(12,2) DEFAULT 0,
        hauling_cost DECIMAL(12,2) DEFAULT 0,
        tarasko_cost DECIMAL(12,2) DEFAULT 0,
        fuel_cost DECIMAL(12,2) DEFAULT 0,
        other_expenses DECIMAL(12,2) DEFAULT 0,

        -- Harvest
        sacks_harvested INT DEFAULT 0,
        kg_per_sack DECIMAL(10,2) DEFAULT 0,
        price_per_kg DECIMAL(10,2) DEFAULT 0,

        -- Computed totals
        total_fertilizer_cost DECIMAL(12,2) DEFAULT 0,
        total_pesticide_cost DECIMAL(12,2) DEFAULT 0,
        total_labor_cost DECIMAL(12,2) DEFAULT 0,
        gross_income DECIMAL(12,2) DEFAULT 0,
        total_expenses DECIMAL(12,2) DEFAULT 0,
        net_income DECIMAL(12,2) DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ farmer_income_records table created');

    // Fertilizers detail table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS farmer_income_fertilizers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        record_id INT UNSIGNED NOT NULL,
        fertilizer_type VARCHAR(20) NOT NULL,
        sacks INT DEFAULT 0,
        price_per_sack DECIMAL(10,2) DEFAULT 0,
        line_total DECIMAL(12,2) DEFAULT 0,

        FOREIGN KEY (record_id) REFERENCES farmer_income_records(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ farmer_income_fertilizers table created');

    // Pesticides detail table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS farmer_income_pesticides (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        record_id INT UNSIGNED NOT NULL,
        pesticide_type VARCHAR(100) NOT NULL,
        quantity INT DEFAULT 0,
        price_per_unit DECIMAL(10,2) DEFAULT 0,
        line_total DECIMAL(12,2) DEFAULT 0,

        FOREIGN KEY (record_id) REFERENCES farmer_income_records(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ farmer_income_pesticides table created');

    console.log('\n🎉 All farmer income tables created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
