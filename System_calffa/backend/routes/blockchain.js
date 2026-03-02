const express = require('express');
const router = express.Router();
const pool = require('../db');

// =====================
// GET BLOCKCHAIN LEDGER
// =====================
router.get('/ledger', async (req, res) => {
  try {
    // Create blockchain_ledger table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS blockchain_ledger (
        id INT AUTO_INCREMENT PRIMARY KEY,
        block_number INT UNIQUE NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        transaction_type VARCHAR(100) NOT NULL,
        farmer_id INT,
        status VARCHAR(50) DEFAULT 'completed',
        previous_hash VARCHAR(255),
        hash VARCHAR(255) UNIQUE NOT NULL,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE SET NULL
      )
    `);

    // Fetch all blocks ordered by block number descending
    const [blocks] = await pool.execute(`
      SELECT 
        id,
        block_number,
        timestamp,
        transaction_type,
        farmer_id,
        status,
        previous_hash,
        hash,
        data
      FROM blockchain_ledger
      ORDER BY block_number DESC
    `);

    res.json({
      success: true,
      blocks: blocks || [],
      count: blocks.length
    });
  } catch (err) {
    console.error('Error fetching blockchain ledger:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching blockchain ledger',
      error: err.message
    });
  }
});

// =====================
// CREATE BLOCKCHAIN ENTRY
// =====================
router.post('/add-block', async (req, res) => {
  try {
    const { transaction_type, farmer_id, data } = req.body;

    if (!transaction_type || !farmer_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: transaction_type, farmer_id'
      });
    }

    // Get the last block to create hash chain
    const [lastBlock] = await pool.execute(`
      SELECT block_number, hash FROM blockchain_ledger
      ORDER BY block_number DESC
      LIMIT 1
    `);

    const blockNumber = lastBlock.length > 0 ? lastBlock[0].block_number + 1 : 1;
    const previousHash = lastBlock.length > 0 ? lastBlock[0].hash : '0x0000000000000000000000000000000000000000';

    // Generate simple hash (in production, use proper hashing)
    const blockHash = generateHash({
      blockNumber,
      transactionType: transaction_type,
      farmerId: farmer_id,
      timestamp: new Date().toISOString(),
      data: JSON.stringify(data || {})
    });

    // Insert new block
    const [result] = await pool.execute(`
      INSERT INTO blockchain_ledger
      (block_number, transaction_type, farmer_id, status, previous_hash, hash, data)
      VALUES (?, ?, ?, 'completed', ?, ?, ?)
    `, [blockNumber, transaction_type, farmer_id, previousHash, blockHash, JSON.stringify(data || {})]);

    res.json({
      success: true,
      message: 'Block added successfully',
      block: {
        id: result.insertId,
        block_number: blockNumber,
        transaction_type,
        farmer_id,
        hash: blockHash,
        previous_hash: previousHash
      }
    });
  } catch (err) {
    console.error('Error adding blockchain block:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error adding block to blockchain',
      error: err.message
    });
  }
});

// =====================
// GET FARMER HISTORY
// =====================
router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    if (!farmerId || isNaN(parseInt(farmerId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farmer ID'
      });
    }

    const [blocks] = await pool.execute(`
      SELECT 
        block_number,
        timestamp,
        transaction_type,
        farmer_id,
        status,
        hash,
        data
      FROM blockchain_ledger
      WHERE farmer_id = ?
      ORDER BY block_number DESC
    `, [parseInt(farmerId)]);

    res.json({
      success: true,
      farmer_id: parseInt(farmerId),
      blocks: blocks || [],
      count: blocks.length
    });
  } catch (err) {
    console.error('Error fetching farmer history:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching farmer history',
      error: err.message
    });
  }
});

// =====================
// VERIFY BLOCKCHAIN INTEGRITY
// =====================
router.get('/verify', async (req, res) => {
  try {
    const [blocks] = await pool.execute(`
      SELECT block_number, hash, previous_hash
      FROM blockchain_ledger
      ORDER BY block_number ASC
    `);

    let isValid = true;
    const issues = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (i === 0) {
        if (block.previous_hash !== '0x0000000000000000000000000000000000000000') {
          isValid = false;
          issues.push(`Block 1 should have genesis hash, got: ${block.previous_hash}`);
        }
      } else {
        const prevBlock = blocks[i - 1];
        if (block.previous_hash !== prevBlock.hash) {
          isValid = false;
          issues.push(`Block ${block.block_number} hash chain broken`);
        }
      }
    }

    res.json({
      success: true,
      is_valid: isValid,
      total_blocks: blocks.length,
      issues: issues
    });
  } catch (err) {
    console.error('Error verifying blockchain:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error verifying blockchain',
      error: err.message
    });
  }
});

// =====================
// HELPER FUNCTION: Generate Hash
// =====================
function generateHash(data) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  return '0x' + hash.digest('hex');
}

module.exports = router;
