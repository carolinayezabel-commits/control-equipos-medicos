const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';

const API_BASE_URL = isLocalhost 
    ? 'http://localhost:10000'
    : 'https://control-equipos-medicos-api.onrender.com';

const API_URL = `${API_BASE_URL}/api`;

// API Key de seguridad
const API_KEY = 'equipos-medicos-seguro-2026';

let equipos = [];

const equiposList = document.getElementById('equiposList');
const equipoForm = document.getElementById('equipoForm');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('statusText');
const apiEndpoint = document.getElementById('apiEndpoint');

document.addEventListener('DOMContentLoaded', () => {
    console.log('Control de Equipos Medicos - Seguro');
    apiEndpoint.textContent = API_BASE_URL;
    checkAPIConnection();
    loadEquipos();
});

equipoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const tipo = document.getElementById('tipo').value;
    const estado = document.getElementById('estado').value;
    const ubicacion = document.getElementById('ubicacion').value.trim();
    const observaciones = document.getElementById('observaciones').value.trim();
    
    if (!nombre || !tipo || !estado || !ubicacion) {
        showNotification('Todos los campos con * son requeridos', 'error');
        return;
    }
    
    await createEquipo({ nombre, tipo, estado, ubicacion, observaciones });
    equipoForm.reset();
    document.getElementById('nombre').focus();
});

async function checkAPIConnection() {
    updateStatus('checking', 'Verificando conexion...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        updateStatus('connected', 'Conectado a la API | Render Cloud');
    } catch (error) {
        updateStatus('error', `Error: ${error.message}`);
    }
}

function updateStatus(state, message) {
    statusDot.className = 'status-dot';
    if (state === 'connected') statusDot.classList.add('connected');
    if (state === 'error') statusDot.classList.add('error');
    statusText.textContent = message;
}

async function loadEquipos() {
    try {
        const response = await fetch(`${API_URL}/equipos`, {
            headers: { 'x-api-key': API_KEY }
        });
        const result = await response.json();
        
        if (result.success) {
            equipos = result.data;
            renderEquipos();
        }
    } catch (error) {
        console.error('Error al cargar equipos:', error);
        equiposList.innerHTML = '<div class="loading">Error al cargar equipos</div>';
    }
}

async function createEquipo(data) {
    try {
        const response = await fetch(`${API_URL}/equipos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            equipos.unshift(result.data);
            renderEquipos();
            showNotification('Equipo registrado exitosamente', 'success');
        }
    } catch (error) {
        console.error('Error al registrar equipo:', error);
        showNotification('Error al registrar el equipo', 'error');
    }
}

async function deleteEquipo(id) {
    const equipo = equipos.find(e => e.id === id);
    if (!equipo) return;
    
    if (!confirm(`Eliminar "${equipo.nombre}"?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/equipos/${id}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY }
        });
        
        const result = await response.json();
        
        if (result.success) {
            equipos = equipos.filter(e => e.id !== id);
            renderEquipos();
            showNotification('Equipo eliminado', 'success');
        }
    } catch (error) {
        console.error('Error al eliminar equipo:', error);
        showNotification('Error al eliminar el equipo', 'error');
    }
}

function getEstadoClass(estado) {
    if (estado === 'Operativo') return 'estado-operativo';
    if (estado === 'En reparacion') return 'estado-reparacion';
    if (estado === 'En mantenimiento') return 'estado-mantenimiento';
    if (estado === 'Fuera de servicio') return 'estado-fuera';
    return '';
}

function renderEquipos() {
    if (equipos.length === 0) {
        equiposList.innerHTML = '<div class="empty-state"><div class="empty-icon">🔬</div><h3>No hay equipos registrados</h3></div>';
        return;
    }
    
    equiposList.innerHTML = equipos.map(equipo => `
        <div class="equipo-card">
            <div class="equipo-header">
                <h3 class="equipo-nombre">${escapeHtml(equipo.nombre)}</h3>
                <span class="estado-badge ${getEstadoClass(equipo.estado)}">${equipo.estado}</span>
            </div>
            <div class="equipo-info">
                <div class="info-item"><span class="info-label">Tipo:</span><span class="info-value">${escapeHtml(equipo.tipo)}</span></div>
                <div class="info-item"><span class="info-label">Ubicacion:</span><span class="info-value">${escapeHtml(equipo.ubicacion)}</span></div>
                <div class="info-item"><span class="info-label">Ultimo Mant.:</span><span class="info-value">${equipo.ultimoMantenimiento}</span></div>
                <div class="info-item"><span class="info-label">Proximo Mant.:</span><span class="info-value">${equipo.proximoMantenimiento}</span></div>
            </div>
            ${equipo.observaciones ? '<p style="color:#666;font-size:0.9rem;">📝 ' + escapeHtml(equipo.observaciones) + '</p>' : ''}
            <div class="equipo-actions">
                <button onclick="deleteEquipo('${equipo.id}')" class="btn btn-small btn-delete">🗑 Eliminar</button>
            </div>
        </div>
    `).join('');
}

function showNotification(message, type) {
    const n = document.createElement('div');
    n.className = 'notification notification-' + type;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 10);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
