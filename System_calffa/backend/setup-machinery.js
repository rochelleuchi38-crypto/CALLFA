// Quick script to check and create machinery tables
require('dotenv').config();
const pool = require('./db');

async function setupMachineryTables() {
  try {
    console.log('🔍 Checking existing tables...');
    
    // Check if tables exist
    const [tables] = await pool.execute("SHOW TABLES LIKE 'machinery%'");
    console.log('📊 Existing machinery tables:', tables.length);
    
    if (tables.length === 0) {
      console.log('\n📝 Creating machinery tables...\n');
      
      // Create machinery_inventory table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS machinery_inventory (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          machinery_name VARCHAR(100) NOT NULL,
          machinery_type ENUM('Harvester', 'Dryer', 'Hauling Track', 'Tractor') NOT NULL,
          description TEXT,
          price_per_unit DECIMAL(10, 2) NOT NULL,
          unit_type VARCHAR(50) NOT NULL,
          max_capacity DECIMAL(10, 2),
          capacity_unit VARCHAR(50),
          status ENUM('Available', 'In Use', 'Under Maintenance', 'Unavailable') DEFAULT 'Available',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          created_by INT UNSIGNED
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ Created machinery_inventory table');
      
      // Create machinery_operators table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS machinery_operators (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          farmer_id INT UNSIGNED NOT NULL,
          machinery_id INT UNSIGNED NOT NULL,
          assigned_date DATE NOT NULL,
          status ENUM('Active', 'Inactive') DEFAULT 'Active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
          FOREIGN KEY (machinery_id) REFERENCES machinery_inventory(id) ON DELETE CASCADE,
          UNIQUE KEY unique_operator_machinery (farmer_id, machinery_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ Created machinery_operators table');
      
      // Create machinery_bookings table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS machinery_bookings (
          id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          farmer_id INT UNSIGNED NOT NULL,
          machinery_id INT UNSIGNED NOT NULL,
          booking_date DATE NOT NULL,
          service_location VARCHAR(255) NOT NULL,
          area_size DECIMAL(10, 2) NOT NULL,
          area_unit VARCHAR(50) NOT NULL,
          total_price DECIMAL(10, 2) NOT NULL,
          status ENUM('Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled') DEFAULT 'Pending',
          approved_by INT UNSIGNED,
          approved_date TIMESTAMP NULL,
          rejection_reason TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
          FOREIGN KEY (machinery_id) REFERENCES machinery_inventory(id) ON DELETE CASCADE,
          FOREIGN KEY (approved_by) REFERENCES farmers(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ Created machinery_bookings table');
      
      // Insert default machinery
      await pool.execute(`
        INSERT INTO machinery_inventory 
        (machinery_name, machinery_type, description, price_per_unit, unit_type, max_capacity, capacity_unit, status)
        VALUES 
          ('Harvester Unit 1', 'Harvester', 'Rice harvester - Maximum 3 hectares per day', 5000.00, 'per hectare', 3.00, 'hectares', 'Available'),
          ('Dryer Unit 1', 'Dryer', 'Grain dryer - 100 kaban per load', 7500.00, 'per load', 100.00, 'kabans', 'Available'),
          ('Hauling Track Unit 1', 'Hauling Track', 'Hauling service for grain transportation', 25.00, 'per kaban', NULL, 'kabans', 'Available'),
          ('Tractor Unit 1', 'Tractor', 'Farm tractor for land preparation', 2500.00, 'per hectare', NULL, 'hectares', 'Available')
      `);
      console.log('✓ Inserted default machinery\n');
      
      // Create indexes
      try {
        await pool.execute('CREATE INDEX idx_machinery_bookings_farmer ON machinery_bookings(farmer_id)');
        await pool.execute('CREATE INDEX idx_machinery_bookings_date ON machinery_bookings(booking_date)');
        await pool.execute('CREATE INDEX idx_machinery_bookings_status ON machinery_bookings(status)');
        await pool.execute('CREATE INDEX idx_machinery_inventory_type ON machinery_inventory(machinery_type)');
        await pool.execute('CREATE INDEX idx_machinery_operators_farmer ON machinery_operators(farmer_id)');
        console.log('✓ Created indexes');
      } catch (error) {
        console.log('ℹ Indexes may already exist');
      }
      
      console.log('\n✅ Machinery tables setup completed!');
    } else {
      console.log('\n✓ Machinery tables already exist');
    }
    
    // Verify tables
    const [finalTables] = await pool.execute("SHOW TABLES LIKE 'machinery%'");
    console.log('\n📊 Machinery tables:');
    finalTables.forEach(row => {
      console.log(`   ✓ ${Object.values(row)[0]}`);
    });
    
    // Check initial data
    const [inventory] = await pool.execute('SELECT * FROM machinery_inventory');
    console.log(`\n📦 Machinery inventory: ${inventory.length} items`);
    inventory.forEach(item => {
      console.log(`   • ${item.machinery_name} - ₱${item.price_per_unit} ${item.unit_type}`);
    });
    
    await pool.end();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setupMachineryTables();
