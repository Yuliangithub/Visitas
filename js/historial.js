document.addEventListener("DOMContentLoaded", () => {
  loadHistorial();
});

const ESTADOS = {
  CUMPLE: 'CUMPLE',
  NO_CUMPLE: 'NO CUMPLE',
  PARCIAL: 'PARCIAL',
  NO_EXISTE: 'NOEXISTE'
};

const TIPOS_EVIDENCIA = {
  HALLAZGO: 'hallazgo',
  CUMPLIMIENTO: 'cumplimiento'
};

const RUTAS = {
  HALLAZGO: '/visitas/uploads/hallazgos/',
  CUMPLIMIENTO: '/visitas/uploads/cumplimientos/'
};


const ENDPOINTS = {
  HALLAZGO: 'backend/evidencias/uploadHallazgo.php',
  CUMPLIMIENTO: 'backend/evidencias/uploadEvidencia.php'
};

function getEvalId(ev) {
  return ev.id ?? ev.eval_id ?? ev.evalId ?? ev.EVAL_ID ?? null;
}

function normalizeEstado(raw) {
  return (raw ?? "").toString().trim().toUpperCase();
}

function createThumbnailElement(src, title = "") {
  const a = document.createElement("a");
  a.href = src;
  a.target = "_blank";
  a.title = title;
  const img = document.createElement("img");
  img.src = src;
  img.alt = title || "Evidencia";
  img.style.cssText = "width:56px;height:56px;object-fit:cover;border-radius:6px;margin-right:6px";
  a.appendChild(img);
  return a;
}

function getEstadoClass(estado, prefix = 'circle') {
  const normalized = normalizeEstado(estado);
  switch (normalized) {
    case ESTADOS.CUMPLE: return `${prefix}-cumple`;
    case ESTADOS.NO_CUMPLE: return `${prefix}-nocumple`;
    case ESTADOS.PARCIAL: return `${prefix}-parcial`;
    default: return `${prefix}-noexiste`;
  }
}

function createUploadButton(evalId, tipo, targetCell, text = "📎", title = "Subir evidencia") {
  const uploadBtn = document.createElement("button");
  uploadBtn.textContent = text;
  uploadBtn.title = title;
  uploadBtn.className = `btn-upload-${tipo}`;
  uploadBtn.addEventListener("click", () => triggerUpload(evalId, tipo, targetCell));
  return uploadBtn;
}

function updateHallazgoCell(evalId, targetCell, fileName) {
  const src = `${RUTAS.HALLAZGO}${fileName}?t=${Date.now()}`;
  targetCell.innerHTML = "";
  targetCell.appendChild(createThumbnailElement(src, "Evidencia hallazgo"));
  targetCell.appendChild(createUploadButton(evalId, TIPOS_EVIDENCIA.HALLAZGO, targetCell, "🔁", "Reemplazar evidencia"));
}

function updateCumplimientoCell(evalId, targetCell, fileName) {
  const src = `${RUTAS.CUMPLIMIENTO}${fileName}?t=${Date.now()}`;
  const thumb = createThumbnailElement(src, "Evidencia cumplimiento");
  const existingUploadBtn = targetCell.querySelector(`.btn-upload-${TIPOS_EVIDENCIA.CUMPLIMIENTO}`);
  existingUploadBtn ? targetCell.insertBefore(thumb, existingUploadBtn) : targetCell.appendChild(thumb);
}

function renderHistorial(data) {
  const container = document.getElementById("historial");
  container.innerHTML = "";

  data.forEach(group => {
    let evaluaciones = group.evaluaciones || [];

    // 🔹 Filtramos las que NO están en CUMPLE
    evaluaciones = evaluaciones.filter(ev => normalizeEstado(ev.estado) !== ESTADOS.CUMPLE);

    // Si no quedan evaluaciones visibles, no mostrar el grupo
    if (evaluaciones.length === 0) return;

    let estados = evaluaciones.map(ev => normalizeEstado(ev.estado));
    let nuevoEstadoGeneral = "NO CUMPLE";

    if (estados.length > 0) {
      if (estados.every(est => est === ESTADOS.CUMPLE)) nuevoEstadoGeneral = ESTADOS.CUMPLE;
      else if (estados.some(est => est === ESTADOS.PARCIAL)) nuevoEstadoGeneral = ESTADOS.PARCIAL;
      else if (estados.every(est => est === ESTADOS.NO_EXISTE)) nuevoEstadoGeneral = ESTADOS.NO_EXISTE;
      else nuevoEstadoGeneral = ESTADOS.NO_CUMPLE;
    }

    const estadoClass = getEstadoClass(nuevoEstadoGeneral, 'badge');
    const aspectDiv = document.createElement("div");
    aspectDiv.classList.add("aspect-group");

    const header = document.createElement("h3");
    header.classList.add("aspect-header");
    header.innerHTML = `
      Aspecto: ${group.nombre}
      <span class="badge ${estadoClass}">${nuevoEstadoGeneral}</span>
    `;

    const content = document.createElement("div");
    content.classList.add("aspect-content");

    const table = createTableTemplate();
    evaluaciones.forEach(ev => {
      table.querySelector("tbody").appendChild(createEvaluationRow(ev));
    });
    content.appendChild(table);

    header.addEventListener("click", () => {
      content.classList.toggle("visible");
    });

    aspectDiv.appendChild(header);
    aspectDiv.appendChild(content);
    container.appendChild(aspectDiv);
  });
}


function createTableTemplate() {
  const table = document.createElement("table");
  table.classList.add("table");
  table.innerHTML = `<thead><tr><th>Fechas</th><th>Visita</th><th>Observación</th><th>Estado</th><th>Plazo</th><th>Recurrente</th><th>Actividad</th><th>Responsable</th><th>Evidencia Hallazgo</th><th>Evidencias Cumplimiento</th><th>Acciones</th></tr></thead><tbody></tbody>`;
  return table;
}

function createEvaluationRow(ev) {
  const evalId = getEvalId(ev);
  const estado = normalizeEstado(ev.estado);
  const circleClass = getEstadoClass(estado, 'circle');
  const evidenciaHallazgoFile = ev.evidencia_hallazgo ?? ev.evidencia ?? ev.hallazgo ?? null;
  const cumplimientos = Array.isArray(ev.cumplimientos) ? ev.cumplimientos : (ev.cumplimientos || []);

  const row = document.createElement("tr");
  row.dataset.evalId = evalId ?? "";
  row.innerHTML = `<td>${ev.fecha_inicio || ""}${ev.fecha_fin ? " - " + ev.fecha_fin : ""}</td><td>${ev.nombre_visita || ""}</td><td>${ev.observacion || ""}</td><td class="td-estado"><span class="circle ${circleClass}" data-id="${evalId ?? ''}" data-estado="${estado}" title="${estado}"></span></td><td>${ev.plazo || ""}</td><td>${ev.recurrente == 1 ? "Sí" : "No"}</td><td>${ev.actividad || ""}</td><td>${ev.responsable || ""}</td><td class="td-evidencia-hallazgo" id="hallazgo-${evalId}"></td><td class="td-evidencias-cumplimiento" id="cumplimientos-${evalId}"></td><td class="td-acciones" id="acciones-${evalId}"></td>`;

  const hallazgoCell = row.querySelector(`#hallazgo-${evalId}`);
  const cumplCell = row.querySelector(`#cumplimientos-${evalId}`);
  const accionesCell = row.querySelector(`#acciones-${evalId}`);

  hallazgoCell.innerHTML = "";
  if (evidenciaHallazgoFile) {
    const src = `${RUTAS.HALLAZGO}${evidenciaHallazgoFile}`;
    hallazgoCell.appendChild(createThumbnailElement(src, "Evidencia hallazgo"));
    hallazgoCell.appendChild(createUploadButton(evalId, TIPOS_EVIDENCIA.HALLAZGO, hallazgoCell, "🔁", "Reemplazar evidencia"));
  } else {
    hallazgoCell.appendChild(createUploadButton(evalId, TIPOS_EVIDENCIA.HALLAZGO, hallazgoCell));
  }

  cumplCell.innerHTML = "";
  cumplimientos.forEach(c => {
    const archivo = c.archivo ?? c.filename ?? c.file ?? null;
    if (archivo) {
      const src = `${RUTAS.CUMPLIMIENTO}${archivo}`;
      cumplCell.appendChild(createThumbnailElement(src, c.uploaded_at ?? "Evidencia cumplimiento"));
    }
  });
  cumplCell.appendChild(createUploadButton(evalId, TIPOS_EVIDENCIA.CUMPLIMIENTO, cumplCell));

  accionesCell.innerHTML = `<button class="btn-ver" data-id="${evalId}">Ver</button>`;
  return row;
}

function setupEstadoToggleListeners() {
  document.querySelectorAll(".circle").forEach(circle => {
    circle.addEventListener("click", handleEstadoToggle);
  });
}

async function handleEstadoToggle(e) {
  const el = e.currentTarget;
  const evalId = el.dataset.id;
  const estadoActual = normalizeEstado(el.dataset.estado);
  const nuevoEstado = (estadoActual === ESTADOS.NO_CUMPLE) ? ESTADOS.CUMPLE : ESTADOS.NO_CUMPLE;

  updateEstadoUI(el, nuevoEstado);

  try {
    const resp = await fetch("backend/evidencias/updateEstado.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: evalId, estado: nuevoEstado })
    });
    const json = await resp.json();

    if (!json.success) {
      updateEstadoUI(el, estadoActual);
      alert("Error guardando estado en BD: " + (json.error ?? "desconocido"));
      return;
    }

    // 🧹 Si pasa a CUMPLE, eliminar la fila visualmente
    if (nuevoEstado === ESTADOS.CUMPLE) {
      const row = el.closest("tr");
      if (row) row.remove();
    }

  } catch (err) {
    console.error("Error en fetch updateEstado:", err);
    updateEstadoUI(el, estadoActual);
    alert("Error al actualizar estado (ver consola).");
  }
}


function updateEstadoUI(element, estado) {
  element.dataset.estado = estado;
  element.title = estado;
  element.classList.remove("circle-cumple", "circle-nocumple", "circle-parcial", "circle-noexiste");
  element.classList.add(getEstadoClass(estado, 'circle'));
}

async function triggerUpload(evalId, tipo, targetCell) {
  try {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      const tempThumb = createThumbnailElement(previewUrl, "Previsualización");

      if (tipo === TIPOS_EVIDENCIA.HALLAZGO) {
        targetCell.innerHTML = "";
        targetCell.appendChild(tempThumb);
      } else {
        const existingUploadBtn = targetCell.querySelector(`.btn-upload-${TIPOS_EVIDENCIA.CUMPLIMIENTO}`);
        existingUploadBtn ? targetCell.insertBefore(tempThumb, existingUploadBtn) : targetCell.appendChild(tempThumb);
      }

      const loadingText = document.createElement("span");
      loadingText.textContent = "Subiendo...";
      loadingText.style.marginLeft = "5px";
      targetCell.appendChild(loadingText);

      const fd = new FormData();
      fd.append("evaluacion_id", evalId);
      fd.append("evidencia", file);

      const endpoint = tipo === TIPOS_EVIDENCIA.HALLAZGO ? ENDPOINTS.HALLAZGO : ENDPOINTS.CUMPLIMIENTO;

      try {
        const resp = await fetch(endpoint, { method: "POST", body: fd });
        const json = await resp.json();
        loadingText.remove();

        if (!json.success) {
          alert("Error al subir evidencia: " + (json.error ?? "desconocido"));
          tempThumb.remove();
          if (tipo === TIPOS_EVIDENCIA.HALLAZGO) {
            targetCell.appendChild(createUploadButton(evalId, TIPOS_EVIDENCIA.HALLAZGO, targetCell));
          }
          return;
        }

        const fileName = json.file.split('/').pop();
        if (tipo === TIPOS_EVIDENCIA.HALLAZGO) {
          updateHallazgoCell(evalId, targetCell, fileName);
        } else {
          updateCumplimientoCell(evalId, targetCell, fileName);
        }

        URL.revokeObjectURL(previewUrl);

      } catch (err) {
        loadingText.remove();
        tempThumb.remove();
        console.error("Error al subir evidencia:", err);
        alert("Error al subir archivo (ver consola).");
        targetCell.appendChild(createUploadButton(evalId, tipo, targetCell));
      }
    });
  } catch (err) {
    console.error("triggerUpload error:", err);
    alert("Error iniciando subida (ver consola).");
  }
}
// ===================== NUEVO: pestañas Pendientes / Cumplidas =====================

// Control de pestañas
document.getElementById("btnPendientes").addEventListener("click", () => {
  document.getElementById("btnPendientes").classList.add("active");
  document.getElementById("btnCumplidas").classList.remove("active");
  document.getElementById("historial").style.display = "block";
  document.getElementById("historialCumplidas").style.display = "none";
});

document.getElementById("btnCumplidas").addEventListener("click", () => {
  document.getElementById("btnCumplidas").classList.add("active");
  document.getElementById("btnPendientes").classList.remove("active");
  document.getElementById("historialCumplidas").style.display = "block";
  document.getElementById("historial").style.display = "none";
});

// Sobrescribimos loadHistorial() para generar ambas vistas
async function loadHistorial() {
  try {
    const res = await fetch("backend/aspectos/listarHistorialGrouped.php");
    if (!res.ok) throw new Error("Error al pedir historial: " + res.status);
    const data = await res.json() || [];

    // Renderizar secciones
    renderHistorialPendientes(data);
    renderHistorialCumplidas(data);

    // Activar toggles de estado
    setupEstadoToggleListeners();

  } catch (err) {
    console.error("loadHistorial error:", err);
    const container = document.getElementById("historial");
    if (container)
      container.innerHTML = `<p style="color:red">Error cargando historial: ${err.message}</p>`;
  }
}

// ===================== NUEVO: render de pendientes =====================
function renderHistorialPendientes(data) {
  const container = document.getElementById("historial");
  container.innerHTML = "";

  data.forEach(group => {
    let evaluaciones = (group.evaluaciones || []).filter(ev => normalizeEstado(ev.estado) !== ESTADOS.CUMPLE);
    if (evaluaciones.length === 0) return;

    const estadoGeneral = calcularEstadoGeneral(evaluaciones);
    const estadoClass = getEstadoClass(estadoGeneral, 'badge');

    const aspectDiv = document.createElement("div");
    aspectDiv.classList.add("aspect-group");

    const header = document.createElement("h3");
    header.classList.add("aspect-header");
    header.innerHTML = `
      Aspecto: ${group.nombre}
      <span class="badge ${estadoClass}">${estadoGeneral}</span>
    `;

    const content = document.createElement("div");
    content.classList.add("aspect-content");

    const table = createTableTemplate();
    evaluaciones.forEach(ev => {
      table.querySelector("tbody").appendChild(createEvaluationRow(ev));
    });

    content.appendChild(table);
    header.addEventListener("click", () => content.classList.toggle("visible"));
    aspectDiv.appendChild(header);
    aspectDiv.appendChild(content);
    container.appendChild(aspectDiv);
  });
}

// ===================== NUEVO: render de cumplidas =====================
function renderHistorialCumplidas(data) {
  const container = document.getElementById("historialCumplidas");
  container.innerHTML = "";

  data.forEach(group => {
    let evaluaciones = (group.evaluaciones || []).filter(ev => normalizeEstado(ev.estado) === ESTADOS.CUMPLE);
    if (evaluaciones.length === 0) return;

    const aspectDiv = document.createElement("div");
    aspectDiv.classList.add("aspect-group");

    const header = document.createElement("h3");
    header.classList.add("aspect-header");
    header.innerHTML = `
      Aspecto: ${group.nombre}
      <span class="badge badge-cumple">CUMPLE</span>
    `;

    const content = document.createElement("div");
    content.classList.add("aspect-content");

    const table = createTableTemplate();
    evaluaciones.forEach(ev => {
      table.querySelector("tbody").appendChild(createEvaluationRow(ev));
    });

    content.appendChild(table);
    header.addEventListener("click", () => content.classList.toggle("visible"));
    aspectDiv.appendChild(header);
    aspectDiv.appendChild(content);
    container.appendChild(aspectDiv);
  });
}

// ===================== NUEVO: función auxiliar =====================
function calcularEstadoGeneral(evaluaciones) {
  const estados = evaluaciones.map(ev => normalizeEstado(ev.estado));
  if (estados.every(est => est === ESTADOS.CUMPLE)) return ESTADOS.CUMPLE;
  if (estados.some(est => est === ESTADOS.PARCIAL)) return ESTADOS.PARCIAL;
  if (estados.every(est => est === ESTADOS.NO_EXISTE)) return ESTADOS.NO_EXISTE;
  return ESTADOS.NO_CUMPLE;
}

// ===================== Ajuste: al cambiar a CUMPLE, mover con animación =====================
async function handleEstadoToggle(e) {
  const el = e.currentTarget;
  const evalId = el.dataset.id;
  const estadoActual = normalizeEstado(el.dataset.estado);
  const nuevoEstado = (estadoActual === ESTADOS.NO_CUMPLE) ? ESTADOS.CUMPLE : ESTADOS.NO_CUMPLE;

  updateEstadoUI(el, nuevoEstado);

  try {
    const resp = await fetch("backend/evidencias/updateEstado.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: evalId, estado: nuevoEstado })
    });
    const json = await resp.json();

    if (!json.success) {
      updateEstadoUI(el, estadoActual);
      alert("Error guardando estado en BD: " + (json.error ?? "desconocido"));
      return;
    }

    // 🎬 Si pasa a CUMPLE, animar y mover al panel Cumplidas
    if (nuevoEstado === ESTADOS.CUMPLE) {
      const row = el.closest("tr");
      if (row) {
        row.style.transition = "opacity 0.4s";
        row.style.opacity = "0";
        setTimeout(() => {
          row.remove();
          loadHistorial(); // recarga para que se actualice en Cumplidas
        }, 400);
      }
    }

  } catch (err) {
    console.error("Error en fetch updateEstado:", err);
    updateEstadoUI(el, estadoActual);
    alert("Error al actualizar estado (ver consola).");
  }
}
