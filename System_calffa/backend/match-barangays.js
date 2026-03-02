const mysql = require('mysql2/promise');
require('dotenv').config();

async function matchBarangaysToAddresses() {
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

  try {
    const connection = await pool.getConnection();
    
    console.log('=== Mapping Farmers to Correct Barangays ===\n');
    
    // Get all barangays
    const [barangays] = await connection.execute(`
      SELECT id, name, status FROM barangays ORDER BY id
    `);
    
    console.log('Available Barangays:');
    console.table(barangays);
    
    // Get all farmers and their current addresses
    const [farmers] = await connection.execute(`
      SELECT id, reference_number, full_name, address, barangay_id FROM farmers ORDER BY id
    `);
    
    console.log('\nCurrent Farmers (first 10):');
    console.table(farmers.slice(0, 10));
    
    // Create a mapping of barangay names to IDs
    const nameToId = {};
    barangays.forEach(b => {
      nameToId[b.name.toLowerCase().trim()] = b.id;
    });
    
    console.log('\nBarangay Name to ID Mapping:');
    console.log(nameToId);
    
    // Update farmers with matching barangays
    let updateCount = 0;
    const updates = [];
    
    for (const farmer of farmers) {
      const addressLower = farmer.address.toLowerCase().trim();
      const matchedBarangayId = nameToId[addressLower];
      
      if (matchedBarangayId && matchedBarangayId !== farmer.barangay_id) {
        updates.push({
          id: farmer.id,
          oldId: farmer.barangay_id,
          newId: matchedBarangayId,
          address: farmer.address,
          name: farmer.full_name
        });
      }
    }
    
    console.log(`\n=== Found ${updates.length} farmers to update ===\n`);
    
    if (updates.length > 0) {
      console.log('Farmers to Update:');
      console.table(updates);
      
      // Apply updates
      console.log('\nApplying updates...\n');
      
      for (const update of updates) {
        await connection.execute(
          'UPDATE farmers SET barangay_id = ? WHERE id = ?',
          [update.newId, update.id]
        );
        console.log(`✅ Farmer ${update.id} (${update.name}): ${update.address} → barangay_id ${update.newId}`);
        updateCount++;
      }
    }
    
    // Show final distribution
    const [distribution] = await connection.execute(`
      SELECT 
        f.barangay_id, 
        b.name,
        b.status,
        COUNT(f.id) as farmer_count 
      FROM farmers f
      LEFT JOIN barangays b ON f.barangay_id = b.id
      GROUP BY f.barangay_id, b.name, b.status
      ORDER BY f.barangay_id
    `);
    
    console.log(`\n=== Final Distribution (${updateCount} farmers updated) ===\n`);
    console.table(distribution);
    
    // Verify no unmatched addresses
    const [unmatched] = await connection.execute(`
      SELECT id, reference_number, full_name, address, barangay_id 
      FROM farmers 
      WHERE address NOT IN (SELECT name FROM barangays)
      LIMIT 10
    `);
    
    if (unmatched.length > 0) {
      console.log('\n⚠️ Unmatched Addresses (could not find matching barangay):');
      console.table(unmatched);
    } else {
      console.log('\n✅ All farmers successfully matched with barangays!');
    }
    
    connection.release();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

matchBarangaysToAddresses();
