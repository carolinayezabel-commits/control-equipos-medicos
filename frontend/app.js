const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE_URL = isLocalhost 
    ? 'http://localhost:10000'
    : 'https://control-equipos-medicos-api.onrender.com';

const API_URL = API_BASE_URL + '/api';
const API_KEY = 'equipos-medicos-seguro-2026';

let equipos = [];
const equiposList = document.getElementById('equiposList');
const equipoForm = document.getElementById('equipoForm');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('statusText');
const apiEndpoint = document.getElementById('apiEndpoint');

document.addEventListener('DOMContentLoaded', function() {
    apiEndpoint.textContent = API_BASE_URL;
    checkAPIConnection();
    loadEquipos();
});

equipoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var nombre = document.getElementById('nombre').value.trim();
    var tipo = document.getElementById('tipo').value;
    var estado = document.getElementById('estado').value;
    var ubicacion = document.getElementById('ubicacion').value.trim();
    var observaciones = document.getElementById('observaciones').value.trim();
    
    if (!nombre || !tipo || !estado || !ubicacion) {
        showNotification('Todos los campos con * son requeridos', 'error');
        return;
    }
    
    await createEquipo({ nombre: nombre, tipo: tipo, estado: estado, ubicacion: ubicacion, observaciones: observaciones });
    equipoForm.reset();
    document.getElementById('nombre').focus();
});

async function checkAPIConnection() {
    updateStatus('checking', 'Verificando conexion...');
    try {
        var response = await fetch(API_BASE_URL + '/health');
        if (response.ok) {
            updateStatus('connected', 'Conectado a la API | Render Cloud');
        }
    } catch (error) {
        updateStatus('error', 'Error: ' + error.message);
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
        var response = await fetch(API_URL + '/equipos', {
            headers: { 'x-api-key': API_KEY }
        });
        var result = await response.json();
        if (result.success) {
            equipos = result.data;
            renderEquipos();
        }
    } catch (error) {
        equiposList.innerHTML = '<div class="loading">Error al cargar equipos</div>';
    }
}

async function createEquipo(data) {
    try {
        var response = await fetch(API_URL + '/equipos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(data)
        });
        var result = await response.json();
        if (result.success) {
            equipos.unshift(result.data);
            renderEquipos();
            showNotification('Equipo registrado exitosamente', 'success');
        }
    } catch (error) {
        showNotification('Error al registrar el equipo', 'error');
    }
}

async function deleteEquipo(id) {
    var equipo = equipos.find(function(e) { return e.id == id; });
    if (!equipo) return;
    
    if (!confirm('Eliminar "' + equipo.nombre + '"?')) return;
    
    try {
        var response = await fetch(API_URL + '/equipos/' + id, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY }
        });
        var result = await response.json();
        if (result.success) {
            equipos = equipos.filter(function(e) { return e.id != id; });
            renderEquipos();
            showNotification('Equipo eliminado', 'success');
        }
    } catch (error) {
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
    
    var html = '';
    equipos.forEach(function(equipo) {
        html += '<div class="equipo-card">';
        html += '<div class="equipo-header">';
        html += '<h3 class="equipo-nombre">' + escapeHtml(equipo.nombre) + '</h3>';
        html += '<span class="estado-badge ' + getEstadoClass(equipo.estado) + '">' + equipo.estado + '</span>';
        html += '</div>';
        html += '<div class="equipo-info">';
        html += '<div class="info-item"><span class="info-label">Tipo:</span><span class="info-value">' + escapeHtml(equipo.tipo) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">Ubicacion:</span><span class="info-value">' + escapeHtml(equipo.ubicacion) + '</span></div>';
        html += '<div class="info-item"><span class="info-label">Ultimo Mant.:</span><span class="info-value">' + (equipo.ultimo_mantenimiento || '-') + '</span></div>';
        html += '<div class="info-item"><span class="info-label">Proximo Mant.:</span><span class="info-value">' + (equipo.proximo_mantenimiento || '-') + '</span></div>';
        html += '</div>';
        if (equipo.observaciones) {
            html += '<p style="color:#666;font-size:0.9rem;">📝 ' + escapeHtml(equipo.observaciones) + '</p>';
        }
        html += '<div class="equipo-actions">';
        html += '<button onclick="deleteEquipo(' + equipo.id + ')" class="btn btn-small btn-delete">🗑 Eliminar</button>';
        html += '</div>';
        html += '</div>';
    });
    equiposList.innerHTML = html;
}

function showNotification(message, type) {
    var n = document.createElement('div');
    n.className = 'notification notification-' + type;
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(function() { n.classList.add('show'); }, 10);
    setTimeout(function() { n.classList.remove('show'); setTimeout(function() { n.remove(); }, 300); }, 3000);
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
