document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("backend/listarDashboard.php");
    const data = await res.json();

    if (data.error) {
      console.error("Error:", data.error);
      showAlert('Error al cargar los datos', 'danger');
      return;
    }

    // Render cards de resumen
    renderResumenCards(data.resumen);
    
    // Render tablas
    renderProximosTable(data.proximos);
    renderVisitasTable(data.visitas);
    
    // Render gráficas
    renderCharts(data);
    
    // Inicializar filtros
    initializeFilters(data);
    
    // Inicializar eventos
    initializeEvents();
    
    // Inicializar tema
    initializeTheme();

  } catch (err) {
    console.error("Error cargando dashboard:", err);
    showAlert('Error de conexión al cargar el dashboard', 'danger');
  }
});

function renderResumenCards(resumen) {
  const resumenDiv = document.getElementById("resumenCards");
  resumenDiv.innerHTML = `
    <div class="col-md-3">
      <div class="card-custom stat-card bg-primary text-white p-3">
        <div class="d-flex align-items-center">
          <div class="me-3">
            <i class="fas fa-calendar-alt fa-2x"></i>
          </div>
          <div>
            <h3>${resumen.visitasAnio}</h3>
            <h6>Visitas este año</h6>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card-custom stat-card bg-warning text-white p-3">
        <div class="d-flex align-items-center">
          <div class="me-3">
            <i class="fas fa-clock fa-2x"></i>
          </div>
          <div>
            <h3>${resumen.pendientes}</h3>
            <h6>Observaciones pendientes</h6>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card-custom stat-card bg-success text-white p-3">
        <div class="d-flex align-items-center">
          <div class="me-3">
            <i class="fas fa-check-circle fa-2x"></i>
          </div>
          <div>
            <h3>${resumen.cumplimiento}%</h3>
            <h6>Cumplimiento</h6>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProximosTable(proximos) {
  const tbody = document.querySelector("#proximosTable tbody");
  tbody.innerHTML = proximos.map(p => `
    <tr>
      <td>${p.id}</td>
      <td>${p.descripcion}</td>
      <td>${formatDate(p.fecha_limite)}</td>
      <td>${p.responsable}</td>
      <td><span class="badge-status badge-${getStatusClass(p.estado)}">${p.estado}</span></td>
    </tr>
  `).join("");
}

function renderVisitasTable(visitas) {
  const tbody = document.querySelector("#visitasTable tbody");
  tbody.innerHTML = visitas.map(v => `
    <tr>
      <td>${formatDate(v.fecha)}</td>
      <td>${v.nombre_visita}</td>
      <td>${v.aspecto}</td>
      <td><span class="badge-status badge-${getStatusClass(v.estado)}">${v.estado}</span></td>
      <td>${v.responsable}</td>
    </tr>
  `).join("");
}

function renderCharts(data) {
  // Gráfica de estado
  new Chart(document.getElementById("statusChart"), {
    type: "doughnut",
    data: {
      labels: data.status.map(s => s.estado),
      datasets: [{
        data: data.status.map(s => s.cantidad),
        backgroundColor: ["#27ae60", "#e74c3c", "#f39c12", "#3498db"],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });

  // Gráfica de responsables
  new Chart(document.getElementById("responsibleChart"), {
    type: "bar",
    data: {
      labels: data.responsables.map(r => r.responsable),
      datasets: [{
        label: 'Visitas',
        data: data.responsables.map(r => r.cantidad),
        backgroundColor: "#3498db",
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function initializeFilters(data) {
  // Llenar filtro de responsables
  const responsables = [...new Set(data.visitas.map(v => v.responsable))];
  const filtroResponsable = document.getElementById('filtroResponsable');
  
  responsables.forEach(responsable => {
    const option = document.createElement('option');
    option.value = responsable;
    option.textContent = responsable;
    filtroResponsable.appendChild(option);
  });

  // Aplicar filtros
  document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroResponsable').addEventListener('change', aplicarFiltros);
  document.getElementById('fechaDesde').addEventListener('change', aplicarFiltros);
  document.getElementById('fechaHasta').addEventListener('change', aplicarFiltros);
}

function aplicarFiltros() {
  const filtroEstado = document.getElementById('filtroEstado').value;
  const filtroResponsable = document.getElementById('filtroResponsable').value;
  const fechaDesde = document.getElementById('fechaDesde').value;
  const fechaHasta = document.getElementById('fechaHasta').value;

  // Filtrar tabla de visitas
  const filasVisitas = document.querySelectorAll('#visitasTable tbody tr');
  filasVisitas.forEach(fila => {
    const estado = fila.cells[3].textContent.trim();
    const responsable = fila.cells[4].textContent.trim();
    const fecha = fila.cells[0].textContent.trim();
    
    let mostrar = true;
    
    if (filtroEstado && estado !== filtroEstado) mostrar = false;
    if (filtroResponsable && responsable !== filtroResponsable) mostrar = false;
    if (fechaDesde && new Date(fecha) < new Date(fechaDesde)) mostrar = false;
    if (fechaHasta && new Date(fecha) > new Date(fechaHasta)) mostrar = false;
    
    fila.style.display = mostrar ? '' : 'none';
  });
}

function initializeEvents() {
  // Toggle tema oscuro
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Eventos de botones de acción
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn-edit')) {
      const id = e.target.closest('.btn-edit').dataset.id;
      editarRegistro(id);
    }
    
    if (e.target.closest('.btn-delete')) {
      const id = e.target.closest('.btn-delete').dataset.id;
      eliminarRegistro(id);
    }
  });
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    localStorage.setItem('theme', 'light');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
  }
}

function getStatusClass(estado) {
  const estados = {
    'Pendiente': 'pendiente',
    'Completado': 'completado',
    'En Proceso': 'en-proceso',
    'Cancelado': 'cancelado'
  };
  return estados[estado] || 'pendiente';
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
}

function showAlert(message, type) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.querySelector('.main-content').prepend(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

function editarRegistro(id) {
  showAlert(`Editando registro ${id}`, 'info');
  // Aquí iría la lógica para editar
}

function eliminarRegistro(id) {
  if (confirm('¿Está seguro de que desea eliminar este registro?')) {
    showAlert(`Registro ${id} eliminado`, 'success');
    // Aquí iría la lógica para eliminar
  }
}