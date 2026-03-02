/**
 * Blockchain Generator Utility
 * Generates test blockchain data and populates the blockchain_ledger table
 * Usage: node generateBlockchain.js
 */

require('dotenv').config();
const pool = require('../db');
const crypto = require('crypto');

// Utility function to generate SHA256 hash
function generateHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Generate blockchain data
async function generateBlockchain() {
  try {
    console.log('🔗 Starting blockchain generation...\n');

    // Step 1: Get all farmers from database
    console.log('📋 Fetching farmers from database...');
    const [farmers] = await pool.execute(
      'SELECT id, reference_number, full_name, phone_number FROM farmers LIMIT 20'
    );

    if (farmers.length === 0) {
      console.log('❌ No farmers found in database. Please add farmers first.');
      process.exit(1);
    }

    console.log(`✅ Found ${farmers.length} farmers\n`);

    // Step 2: Clear existing blockchain data (optional)
    console.log('🗑️  Clearing existing blockchain ledger...');
    await pool.execute('DELETE FROM blockchain_ledger');
    console.log('✅ Blockchain cleared\n');

    // Step 3: Create genesis block
    console.log('⛓️  Creating genesis block...');
    const genesisData = {
      message: 'Genesis Block - Blockchain Initialized',
      timestamp: new Date().toISOString(),
      farmers_count: farmers.length
    };
    
    const genesisHash = generateHash(genesisData);
    
    await pool.execute(
      `INSERT INTO blockchain_ledger 
       (block_number, timestamp, transaction_type, farmer_id, status, previous_hash, hash, data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [1, new Date(), 'GENESIS', null, 'completed', '0000000000000000000000000000000000000000000000000000000000000000', genesisHash, JSON.stringify(genesisData)]
    );
    
    console.log('✅ Genesis block created\n');

    // Step 4: Generate blocks for each farmer
    console.log('🌱 Generating blocks for farmers...\n');
    
    let previousHash = genesisHash;
    let blockNumber = 2;
    
    for (const farmer of farmers) {
      // Randomly decide: approve, reject, or register
      const actions = ['REGISTRATION', 'APPROVAL', 'REJECTION'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      // Create realistic statuses
      let status = 'pending';
      if (randomAction === 'APPROVAL') {
        status = 'completed';
      } else if (randomAction === 'REJECTION') {
        status = 'rejected';
      } else {
        status = 'pending';
      }

      const blockData = {
        farmer_id: farmer.id,
        reference_number: farmer.reference_number,
        full_name: farmer.full_name,
        phone_number: farmer.phone_number,
        action: randomAction,
        description: getActionDescription(randomAction, farmer.full_name)
      };

      const currentHash = generateHash({
        ...blockData,
        previous_hash: previousHash,
        block_number: blockNumber,
        timestamp: new Date().toISOString()
      });

      await pool.execute(
        `INSERT INTO blockchain_ledger 
         (block_number, timestamp, transaction_type, farmer_id, status, previous_hash, hash, data, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          blockNumber,
          new Date(),
          randomAction,
          farmer.id,
          status,
          previousHash,
          currentHash,
          JSON.stringify(blockData)
        ]
      );

      console.log(`  Block #${blockNumber}: ${randomAction} - ${farmer.full_name} ✓`);

      previousHash = currentHash;
      blockNumber++;

      // Optional: Add some transactions per farmer
      if (Math.random() > 0.6) {
        const additionalActions = randomAction === 'APPROVAL' ? ['VERIFICATION'] : ['REVIEW'];
        for (const additionalAction of additionalActions) {
          const additionalData = {
            farmer_id: farmer.id,
            reference_number: farmer.reference_number,
            action: additionalAction,
            description: getActionDescription(additionalAction, farmer.full_name)
          };

          const additionalHash = generateHash({
            ...additionalData,
            previous_hash: previousHash,
            block_number: blockNumber,
            timestamp: new Date().toISOString()
          });

          await pool.execute(
            `INSERT INTO blockchain_ledger 
             (block_number, timestamp, transaction_type, farmer_id, status, previous_hash, hash, data, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              blockNumber,
              new Date(),
              additionalAction,
              farmer.id,
              'completed',
              previousHash,
              additionalHash,
              JSON.stringify(additionalData)
            ]
          );

          console.log(`  Block #${blockNumber}: ${additionalAction} - ${farmer.full_name} ✓`);
          previousHash = additionalHash;
          blockNumber++;
        }
      }
    }

    console.log(`\n✅ Blockchain generation complete!\n`);
    console.log(`📊 Statistics:`);
    console.log(`   • Total Blocks: ${blockNumber - 1}`);
    console.log(`   • Genesis Block: 1`);
    console.log(`   • Transaction Blocks: ${blockNumber - 2}`);
    console.log(`   • Farmers Processed: ${farmers.length}\n`);

    // Step 5: Verify blockchain integrity
    console.log('🔍 Verifying blockchain integrity...');
    const [blocks] = await pool.execute('SELECT * FROM blockchain_ledger ORDER BY block_number ASC');
    
    let isValid = true;
    let previousBlockHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (const block of blocks) {
      if (block.block_number > 1 && block.previous_hash !== previousBlockHash) {
        isValid = false;
        console.log(`❌ Chain broken at block #${block.block_number}`);
        break;
      }
      previousBlockHash = block.hash;
    }

    if (isValid) {
      console.log('✅ Blockchain integrity verified - chain is valid!\n');
    }

    console.log('🎉 Blockchain ready for use!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error generating blockchain:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Helper function to generate descriptions
function getActionDescription(action, farmerName) {
  const descriptions = {
    REGISTRATION: `${farmerName} registered for the agricultural program`,
    APPROVAL: `${farmerName} approved by admin`,
    REJECTION: `${farmerName} application rejected`,
    VERIFICATION: `${farmerName} documents verified`,
    REVIEW: `${farmerName} profile reviewed`
  };
  return descriptions[action] || 'Transaction recorded';
}

// Run the generator
generateBlockchain();
