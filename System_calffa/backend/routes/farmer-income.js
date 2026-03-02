const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/farmer-income - Save a new income record
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      farmer_id,
      area_hectares,
      planting_method,
      irrigation_type,
      fertilizers,
      pesticides,
      land_preparation_cost,
      planting_cost,
      spraying_cost,
      harvester_cost,
      drying_cost,
      hauling_cost,
      tarasko_cost,
      fuel_cost,
      other_expenses,
      sacks_harvested,
      kg_per_sack,
      price_per_kg,
      total_fertilizer_cost,
      total_pesticide_cost,
      total_labor_cost,
      gross_income,
      total_expenses,
      net_income
    } = req.body;

    // Validate required fields
    if (!farmer_id || !area_hectares || !planting_method || !irrigation_type) {
      return res.status(400).json({ error: 'Kulang ang mga kinakailangang impormasyon.' });
    }

    // Insert main income record
    const [result] = await conn.execute(
      `INSERT INTO farmer_income_records (
        farmer_id, area_hectares, planting_method, irrigation_type,
        land_preparation_cost, planting_cost, spraying_cost, harvester_cost,
        drying_cost, hauling_cost, tarasko_cost, fuel_cost, other_expenses,
        sacks_harvested, kg_per_sack, price_per_kg,
        total_fertilizer_cost, total_pesticide_cost, total_labor_cost,
        gross_income, total_expenses, net_income
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmer_id, area_hectares, planting_method, irrigation_type,
        land_preparation_cost || 0, planting_cost || 0, spraying_cost || 0, harvester_cost || 0,
        drying_cost || 0, hauling_cost || 0, tarasko_cost || 0, fuel_cost || 0, other_expenses || 0,
        sacks_harvested || 0, kg_per_sack || 0, price_per_kg || 0,
        total_fertilizer_cost || 0, total_pesticide_cost || 0, total_labor_cost || 0,
        gross_income || 0, total_expenses || 0, net_income || 0
      ]
    );

    const recordId = result.insertId;

    // Insert fertilizers
    if (fertilizers && fertilizers.length > 0) {
      for (const f of fertilizers) {
        if (f.type) {
          await conn.execute(
            `INSERT INTO farmer_income_fertilizers (record_id, fertilizer_type, sacks, price_per_sack, line_total)
             VALUES (?, ?, ?, ?, ?)`,
            [recordId, f.type, f.sacks || 0, f.price_per_sack || 0, (f.sacks || 0) * (f.price_per_sack || 0)]
          );
        }
      }
    }

    // Insert pesticides
    if (pesticides && pesticides.length > 0) {
      for (const p of pesticides) {
        if (p.type) {
          await conn.execute(
            `INSERT INTO farmer_income_pesticides (record_id, pesticide_type, quantity, price_per_unit, line_total)
             VALUES (?, ?, ?, ?, ?)`,
            [recordId, p.type, p.quantity || 0, p.price_per_unit || 0, (p.quantity || 0) * (p.price_per_unit || 0)]
          );
        }
      }
    }

    await conn.commit();

    res.status(201).json({
      message: 'Matagumpay na naitala ang kita!',
      id: recordId
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error saving farmer income:', err);
    res.status(500).json({ error: 'May problema sa pag-save ng talaan.' });
  } finally {
    conn.release();
  }
});

// GET /api/farmer-income/by-barangay/:barangayId - Get all income records for a barangay (for officers)
router.get('/by-barangay/:barangayId', async (req, res) => {
  try {
    const { barangayId } = req.params;

    const [records] = await pool.execute(
      `SELECT r.*, f.full_name as farmer_name, f.barangay_id
       FROM farmer_income_records r
       JOIN farmers f ON r.farmer_id = f.id
       WHERE f.barangay_id = ?
       ORDER BY r.created_at DESC`,
      [barangayId]
    );

    // Fetch fertilizers and pesticides for each record
    for (const record of records) {
      const [fertilizers] = await pool.execute(
        `SELECT * FROM farmer_income_fertilizers WHERE record_id = ?`,
        [record.id]
      );
      record.fertilizers = fertilizers;

      const [pesticides] = await pool.execute(
        `SELECT * FROM farmer_income_pesticides WHERE record_id = ?`,
        [record.id]
      );
      record.pesticides = pesticides;
    }

    res.json(records);
  } catch (err) {
    console.error('Error fetching barangay income records:', err);
    res.status(500).json({ error: 'Hindi makuha ang mga talaan.' });
  }
});

// GET /api/farmer-income/:farmerId - Get all income records for a farmer
router.get('/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;

    const [records] = await pool.execute(
      `SELECT * FROM farmer_income_records WHERE farmer_id = ? ORDER BY created_at DESC`,
      [farmerId]
    );

    // Fetch fertilizers and pesticides for each record
    for (const record of records) {
      const [fertilizers] = await pool.execute(
        `SELECT * FROM farmer_income_fertilizers WHERE record_id = ?`,
        [record.id]
      );
      record.fertilizers = fertilizers;

      const [pesticides] = await pool.execute(
        `SELECT * FROM farmer_income_pesticides WHERE record_id = ?`,
        [record.id]
      );
      record.pesticides = pesticides;
    }

    res.json(records);
  } catch (err) {
    console.error('Error fetching farmer income records:', err);
    res.status(500).json({ error: 'Hindi makuha ang mga talaan.' });
  }
});

// GET /api/farmer-income/record/:id - Get a single income record with details
router.get('/record/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [records] = await pool.execute(
      `SELECT r.*, f.full_name as farmer_name
       FROM farmer_income_records r
       JOIN farmers f ON r.farmer_id = f.id
       WHERE r.id = ?`,
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({ error: 'Hindi makita ang talaan.' });
    }

    const record = records[0];

    const [fertilizers] = await pool.execute(
      `SELECT * FROM farmer_income_fertilizers WHERE record_id = ?`,
      [id]
    );
    record.fertilizers = fertilizers;

    const [pesticides] = await pool.execute(
      `SELECT * FROM farmer_income_pesticides WHERE record_id = ?`,
      [id]
    );
    record.pesticides = pesticides;

    res.json(record);
  } catch (err) {
    console.error('Error fetching income record:', err);
    res.status(500).json({ error: 'Hindi makuha ang talaan.' });
  }
});

// DELETE /api/farmer-income/:id - Delete an income record
router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    // Delete child records first
    await conn.execute('DELETE FROM farmer_income_fertilizers WHERE record_id = ?', [id]);
    await conn.execute('DELETE FROM farmer_income_pesticides WHERE record_id = ?', [id]);
    await conn.execute('DELETE FROM farmer_income_records WHERE id = ?', [id]);

    await conn.commit();
    res.json({ message: 'Matagumpay na nabura ang talaan.' });
  } catch (err) {
    await conn.rollback();
    console.error('Error deleting income record:', err);
    res.status(500).json({ error: 'Hindi mabura ang talaan.' });
  } finally {
    conn.release();
  }
});

// PUT /api/farmer-income/:id - Update an income record (farmer only)
router.put('/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    const {
      farmer_id,
      area_hectares,
      planting_method,
      irrigation_type,
      fertilizers,
      pesticides,
      land_preparation_cost,
      planting_cost,
      spraying_cost,
      harvester_cost,
      drying_cost,
      hauling_cost,
      tarasko_cost,
      fuel_cost,
      other_expenses,
      sacks_harvested,
      kg_per_sack,
      price_per_kg,
      total_fertilizer_cost,
      total_pesticide_cost,
      total_labor_cost,
      gross_income,
      total_expenses,
      net_income
    } = req.body;

    // Verify ownership
    const [existing] = await conn.execute('SELECT farmer_id FROM farmer_income_records WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Hindi makita ang talaan.' });
    }
    if (existing[0].farmer_id !== farmer_id) {
      return res.status(403).json({ error: 'Hindi mo maaaring i-edit ang talaang ito.' });
    }

    // Update main record
    await conn.execute(
      `UPDATE farmer_income_records SET
        area_hectares = ?, planting_method = ?, irrigation_type = ?,
        land_preparation_cost = ?, planting_cost = ?, spraying_cost = ?, harvester_cost = ?,
        drying_cost = ?, hauling_cost = ?, tarasko_cost = ?, fuel_cost = ?, other_expenses = ?,
        sacks_harvested = ?, kg_per_sack = ?, price_per_kg = ?,
        total_fertilizer_cost = ?, total_pesticide_cost = ?, total_labor_cost = ?,
        gross_income = ?, total_expenses = ?, net_income = ?
      WHERE id = ?`,
      [
        area_hectares, planting_method, irrigation_type,
        land_preparation_cost || 0, planting_cost || 0, spraying_cost || 0, harvester_cost || 0,
        drying_cost || 0, hauling_cost || 0, tarasko_cost || 0, fuel_cost || 0, other_expenses || 0,
        sacks_harvested || 0, kg_per_sack || 0, price_per_kg || 0,
        total_fertilizer_cost || 0, total_pesticide_cost || 0, total_labor_cost || 0,
        gross_income || 0, total_expenses || 0, net_income || 0,
        id
      ]
    );

    // Replace fertilizers: delete old, insert new
    await conn.execute('DELETE FROM farmer_income_fertilizers WHERE record_id = ?', [id]);
    if (fertilizers && fertilizers.length > 0) {
      for (const f of fertilizers) {
        if (f.type) {
          await conn.execute(
            `INSERT INTO farmer_income_fertilizers (record_id, fertilizer_type, sacks, price_per_sack, line_total)
             VALUES (?, ?, ?, ?, ?)`,
            [id, f.type, f.sacks || 0, f.price_per_sack || 0, (f.sacks || 0) * (f.price_per_sack || 0)]
          );
        }
      }
    }

    // Replace pesticides: delete old, insert new
    await conn.execute('DELETE FROM farmer_income_pesticides WHERE record_id = ?', [id]);
    if (pesticides && pesticides.length > 0) {
      for (const p of pesticides) {
        if (p.type) {
          await conn.execute(
            `INSERT INTO farmer_income_pesticides (record_id, pesticide_type, quantity, price_per_unit, line_total)
             VALUES (?, ?, ?, ?, ?)`,
            [id, p.type, p.quantity || 0, p.price_per_unit || 0, (p.quantity || 0) * (p.price_per_unit || 0)]
          );
        }
      }
    }

    await conn.commit();
    res.json({ message: 'Matagumpay na na-update ang talaan!' });
  } catch (err) {
    await conn.rollback();
    console.error('Error updating farmer income:', err);
    res.status(500).json({ error: 'May problema sa pag-update ng talaan.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
