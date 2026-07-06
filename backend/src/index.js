const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

let equipos = [
  {
    id: '1',
    nombre: 'Microscopio Olympus CX23',
    tipo: 'Microscopio',
    estado: 'Operativo',
    ubicacion: 'Laboratorio A',
    ultimoMantenimiento: '2025-06-15',
    proximoMantenimiento: '2025-12-15',
    observaciones: 'Calibración realizada correctamente'
  },
  {
    id: '2',
    nombre: 'Centrífuga Eppendorf 5425',
    tipo: 'Centrífuga',
    estado: 'En reparación',
    ubicacion: 'Laboratorio B',
    ultimoMantenimiento: '2025-05-20',
    proximoMantenimiento: '2025-11-20',
    observaciones: 'Presenta ruido anormal al funcionar'
  },
  {
    id: '3',
    nombre: 'Espectrofotómetro UV-Vis',
    tipo: 'Espectrofotómetro',
    estado: 'Operativo',
    ubicacion: 'Laboratorio A',
    ultimoMantenimiento: '2025-07-01',
    proximoMantenimiento: '2026-01-01',
    observaciones: 'Lámpara de deuterio reemplazada'
  }
];

app.get('/', (req, res) => {
  res.json({
    nombre: 'API Control de Equipos Médicos',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/equipos', (req, res) => {
  res.json({
    success: true,
    total: equipos.length,
    data: equipos
  });
});

app.post('/api/equipos', (req, res) => {
  const { nombre, tipo, estado, ubicacion, observaciones } = req.body;
  
  if (!nombre || !tipo || !estado || !ubicacion) {
    return res.status(400).json({
      success: false,
      message: 'Campos requeridos: nombre, tipo, estado, ubicacion'
    });
  }
  
  const nuevoEquipo = {
    id: require('uuid').v4(),
    nombre,
    tipo,
    estado,
    ubicacion,
    ultimoMantenimiento: new Date().toISOString().split('T')[0],
    proximoMantenimiento: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observaciones: observaciones || ''
  };
  
  equipos.unshift(nuevoEquipo);
  
  res.status(201).json({
    success: true,
    data: nuevoEquipo
  });
});

app.delete('/api/equipos/:id', (req, res) => {
  const index = equipos.findIndex(e => e.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Equipo no encontrado'
    });
  }
  
  const eliminado = equipos[index];
  equipos.splice(index, 1);
  
  res.json({
    success: true,
    data: eliminado
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});
