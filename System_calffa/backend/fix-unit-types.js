require('dotenv').config();
const pool = require('./db');

async function fixUnitTypes() {
  try {
    console.log('🔧 Fixing machinery unit_type values...');
    
    // Update Dryer: "load" → "per load"
    const [result1] = await pool.execute(
      "UPDATE machinery_inventory SET unit_type = 'per load' WHERE machinery_type = 'Dryer'"
    );
    console.log(`✅ Updated ${result1.affectedRows} Dryer(s): load → per load`);
    
    // Update Harvester: "hectare" → "per hectare"
    const [result2] = await pool.execute(
      "UPDATE machinery_inventory SET unit_type = 'per hectare' WHERE machinery_type = 'Harvester'"
    );
    console.log(`✅ Updated ${result2.affectedRows} Harvester(s): hectare → per hectare`);
    
    // Verify the updates
    console.log('\n📊 Verification:');
    const [rows] = await pool.execute(
      "SELECT machinery_type, unit_type, COUNT(*) as count FROM machinery_inventory GROUP BY machinery_type, unit_type"
    );
    
    rows.forEach(row => {
      console.log(`  ${row.machinery_type}: unit_type="${row.unit_type}" (${row.count} items)`);
    });
    
    console.log('\n✨ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUnitTypes();
