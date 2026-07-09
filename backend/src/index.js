const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;
const API_KEY = process.env.API_KEY || 'equipos-medicos-seguro-2026';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:eoptxhCy5KjYEiU2aiK3gynCQsv3iNkJ@dpg-d97e6petrd3s73aunk2g-a.oregon-postgres.render.com/equipos_db_vfno',
  ssl: { rejectUnauthorized: false }
});

function verificarAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ success: false, message: 'Acceso denegado' });
  if (apiKey !== API_KEY) return res.status(403).json({ success: false, message: 'API Key invalida' });
  next();
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ nombre: 'API Control Equipos Medicos', version: '2.0.0', baseDeDatos: 'PostgreSQL' });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Conectada', timestamp: new Date().toISOString() });
  } catch (e) {
    res.json({ status: 'OK', database: 'Desconectada' });
  }
});

app.get('/api/equipos', verificarAPIKey, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipos ORDER BY created_at DESC');
    res.json({ success: true, total: result.rows.length, data: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/equipos', verificarAPIKey, async (req, res) => {
  const { nombre, tipo, estado, ubicacion, observaciones } = req.body;
  if (!nombre || !tipo || !estado || !ubicacion) {
    return res.status(400).json({ success: false, message: 'Campos requeridos' });
  }
  try {
    const u = new Date().toISOString().split('T')[0];
    const p = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const result = await pool.query(
      'INSERT INTO equipos (nombre, tipo, estado, ubicacion, ultimo_mantenimiento, proximo_mantenimiento, observaciones) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [nombre, tipo, estado, ubicacion, u, p, observaciones || '']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put('/api/equipos/:id', verificarAPIKey, async (req, res) => {
  const { nombre, tipo, estado, ubicacion, observaciones } = req.body;
  try {
    const result = await pool.query(
      'UPDATE equipos SET nombre=$1, tipo=$2, estado=$3, ubicacion=$4, observaciones=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [nombre, tipo, estado, ubicacion, observaciones || '', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete('/api/equipos/:id', verificarAPIKey, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM equipos WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log('Servidor en puerto ' + PORT);
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL conectada');
    const count = await pool.query('SELECT COUNT(*) FROM equipos');
    if (parseInt(count.rows[0].count) === 0) {
      await pool.query("INSERT INTO equipos (nombre, tipo, estado, ubicacion, ultimo_mantenimiento, proximo_mantenimiento, observaciones) VALUES ('Microscopio Olympus CX23','Microscopio','Operativo','Laboratorio A','2025-06-15','2025-12-15','Calibracion OK'),('Centrifuga Eppendorf 5425','Centrifuga','En reparacion','Laboratorio B','2025-05-20','2025-11-20','Ruido anormal'),('Espectrofotometro UV-Vis','Espectrofotometro','Operativo','Laboratorio A','2025-07-01','2026-01-01','Lampara reemplazada')");
      console.log('Datos de prueba insertados');
    }
  } catch (e) {
    console.error('Error DB:', e.message);
  }
});
