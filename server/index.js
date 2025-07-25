require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// PVM endpoints
app.get('/api/pvms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM pvms');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pvms' });
  }
});

app.post('/api/pvms', async (req, res) => {
  try {
    const { number, status, currentMileage = 0, totalMileage = 0, streamId = null } = req.body;
    const [result] = await pool.query(
      'INSERT INTO pvms (number, status, currentMileage, totalMileage, streamId) VALUES (?, ?, ?, ?, ?)',
      [number, status, currentMileage, totalMileage, streamId]
    );
    const [rows] = await pool.query('SELECT * FROM pvms WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create pvm' });
  }
});

app.put('/api/pvms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { number, status, currentMileage, totalMileage, streamId } = req.body;
    await pool.query(
      'UPDATE pvms SET number=?, status=?, currentMileage=?, totalMileage=?, streamId=? WHERE id=?',
      [number, status, currentMileage, totalMileage, streamId, id]
    );
    const [rows] = await pool.query('SELECT * FROM pvms WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update pvm' });
  }
});

app.delete('/api/pvms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM runs WHERE pvmId = ?', [id]);
    await pool.query('DELETE FROM pvms WHERE id = ?', [id]);
    res.json({ message: 'PVM deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete pvm' });
  }
});

// Run endpoints
app.get('/api/runs', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM runs');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch runs' });
  }
});

app.post('/api/runs', async (req, res) => {
  try {
    const { pvmId, pvmNumber, date, billetCount = null, billetSize = null, scrap = null, mileage, type, streamId = null } = req.body;
    const [result] = await pool.query(
      'INSERT INTO runs (pvmId, pvmNumber, date, billetCount, billetSize, scrap, mileage, type, streamId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [pvmId, pvmNumber, date, billetCount, billetSize, scrap, mileage, type, streamId]
    );
    const [rows] = await pool.query('SELECT * FROM runs WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create run' });
  }
});

app.put('/api/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pvmId, pvmNumber, date, billetCount, billetSize, scrap, mileage, type, streamId } = req.body;
    await pool.query(
      'UPDATE runs SET pvmId=?, pvmNumber=?, date=?, billetCount=?, billetSize=?, scrap=?, mileage=?, type=?, streamId=? WHERE id=?',
      [pvmId, pvmNumber, date, billetCount, billetSize, scrap, mileage, type, streamId, id]
    );
    const [rows] = await pool.query('SELECT * FROM runs WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update run' });
  }
});

app.delete('/api/runs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM runs WHERE id = ?', [id]);
    res.json({ message: 'Run deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete run' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
