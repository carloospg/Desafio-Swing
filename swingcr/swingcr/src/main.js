import "./css/style.css";

import { Clase, Actividad, haysolapamiento, horaAMinutos } from "./js/models/evento.js";
import { guardarEventos, cargarEventos } from "./js/services/almacenamiento.js";
import { renderHeader, renderFooter } from "./js/components/headerFooter.js";
import { mostrarNotificacion } from "./js/components/notificaciones.js";


document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    if (document.querySelector("#registro")) {
        inicializarFormularioUnificado();
    }

    if (document.querySelector("#programa")) {
        inicializarTabsDias();
        mostrarEventos();
        inicializarModales();
        inicializarDragDrop();
    }
});

// ─────────────────────────────────────────────────────────────
//  TABS DE DÍAS
//  Gestiona los botones VIERNES / SABADO / DOMINGO del calendario.
//  Al hacer click en uno, muestra su panel y oculta los demás.
// ─────────────────────────────────────────────────────────────
function inicializarTabsDias() {
    const tabBtns   = document.querySelectorAll(".tab-btn");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabBtns.forEach((b) => {
                b.classList.remove("activo");
                b.setAttribute("aria-selected", "false");
            });
            tabPanels.forEach((p) => p.classList.remove("activo"));

            btn.classList.add("activo");
            btn.setAttribute("aria-selected", "true");
            document.getElementById("panel-" + btn.dataset.tab).classList.add("activo");
        });
    });
}

// ─────────────────────────────────────────────────────────────
//  UTILIDADES DE HORA
// ─────────────────────────────────────────────────────────────
const RANGOS_DIA = {
    viernes: { min: "20:00", max: "03:00" },
    sabado:  { min: "10:00", max: "03:00" },
    domingo: { min: "10:00", max: "20:00" },
};

// Genera un array de horas en intervalos de 30 minutos entre horaMin y horaMax.
// El caso especial es cuando el máximo es menor que el mínimo (cruce de medianoche):
// si max <= min, sumamos 24h al límite para que el bucle funcione correctamente.
// Ejemplo: min="22:00", max="02:00" → genera 22:00, 22:30, 23:00, 23:30, 00:00, 00:30, 01:00, 01:30, 02:00
function generarOpcionesHora(horaMin, horaMax) {
    const opciones = [];
    let minutos    = horaAMinutos(horaMin);
    const maxMin   = horaAMinutos(horaMax);
    const limite   = maxMin <= minutos ? maxMin + 24 * 60 : maxMin;

    while (minutos <= limite) {
        // Convertimos los minutos acumulados de vuelta a formato "HH:MM"
        const h = Math.floor((minutos % (24 * 60)) / 60).toString().padStart(2, "0");
        const m = (minutos % 60).toString().padStart(2, "0");
        opciones.push(`${h}:${m}`);
        minutos += 30;
    }

    return opciones;
}

// Rellena un elemento <select> con las opciones de hora generadas.
// Siempre añade primero un placeholder deshabilitado para forzar al usuario a elegir.
function rellenarSelect(selectEl, horaMin, horaMax, placeholder) {
    selectEl.innerHTML = "";

    const optPlaceholder = document.createElement("option");
    optPlaceholder.value       = "";
    optPlaceholder.textContent = placeholder;
    optPlaceholder.disabled    = true;
    optPlaceholder.selected    = true;
    selectEl.appendChild(optPlaceholder);

    generarOpcionesHora(horaMin, horaMax).forEach((hora) => {
        const opt = document.createElement("option");
        opt.value       = hora;
        opt.textContent = hora;
        selectEl.appendChild(opt);
    });
}

function inicializarFormularioUnificado() {
    const tabFormBtns      = document.querySelectorAll(".tab-form-btn");
    const camposClase      = document.getElementById("campos-clase");
    const camposAct        = document.getElementById("campos-actividad");
    const diaSelect        = document.getElementById("dia-evento");
    const horaInicioSelect = document.getElementById("hora-inicio");
    const horaFinSelect    = document.getElementById("hora-fin");
    const form             = document.getElementById("form-evento");
    const mensajeError     = document.getElementById("mensaje-error");
    const btnSubmit        = form.querySelector(".btn-submit");

    let tipoActivo       = "clase";
    let modoEdicion      = false;
    let eventoEditandoId = null;

    const params   = new URLSearchParams(window.location.search);
    const idEditar = params.get("editar");

    // Si hay un parámetro "editar" en la URL, activamos el modo edición
    if (idEditar) {
        const eventos      = cargarEventos();
        const eventoEditar = eventos.find((e) => String(e.id) === idEditar);

        if (eventoEditar) {
            modoEdicion      = true;
            eventoEditandoId = eventoEditar.id;

            // Cambiamos el título y el botón para dejar claro que estamos editando
            const titulo = document.querySelector("#registro h2");
            if (titulo) titulo.textContent = "EDITAR EVENTO";
            btnSubmit.textContent = "GUARDAR CAMBIOS";

            // Activamos el tab correcto según el tipo del evento que se edita
            tipoActivo = eventoEditar.tipo;
            tabFormBtns.forEach((btn) => {
                const esActivo = btn.dataset.tipo === tipoActivo;
                btn.classList.toggle("activo", esActivo);
                btn.setAttribute("aria-selected", esActivo ? "true" : "false");
            });

            // Mostramos el bloque de campos correspondiente al tipo
            if (tipoActivo === "clase") {
                camposClase.classList.remove("oculto");
                camposAct.classList.add("oculto");
            } else {
                camposClase.classList.add("oculto");
                camposAct.classList.remove("oculto");
            }

            // Precargamos los campos comunes con los datos del evento
            document.getElementById("nombre-evento").value = eventoEditar.nombre;
            diaSelect.value = eventoEditar.dia;

            actualizarSelectsHora();
            horaInicioSelect.value = eventoEditar.horaInicio;

            // Regeneramos el select de fin a partir de la hora de inicio cargada,
            // para que el mínimo sea inicio+30min y no pueda elegirse una hora anterior
            const rango      = RANGOS_DIA[eventoEditar.dia];
            let minMinFin    = horaAMinutos(eventoEditar.horaInicio) + 30;
            const horaMinFin = `${Math.floor((minMinFin % (24 * 60)) / 60).toString().padStart(2, "0")}:${(minMinFin % 60).toString().padStart(2, "0")}`;
            rellenarSelect(horaFinSelect, horaMinFin, rango.max, "Hora de fin");
            horaFinSelect.value = eventoEditar.horaFin;

            document.getElementById("estilo-evento").value = eventoEditar.estilo;

            if (tipoActivo === "clase") {
                document.getElementById("sala-clase").value     = eventoEditar.sala;
                document.getElementById("profesor-clase").value = eventoEditar.profesor;
                document.getElementById("nivel-clase").value    = eventoEditar.nivel;
            } else {
                document.getElementById("tipo-actividad").value        = eventoEditar.tipoActividad;
                document.getElementById("ubicacion-actividad").value   = eventoEditar.ubicacion;
                document.getElementById("banda-actividad").value       = eventoEditar.banda       || "";
                document.getElementById("profesor-actividad").value    = eventoEditar.profesor    || "";
                document.getElementById("descripcion-actividad").value = eventoEditar.descripcion || "";
            }
        }
    }

    function actualizarSelectsHora() {
        const rango = RANGOS_DIA[diaSelect.value];
        rellenarSelect(horaInicioSelect, rango.min, rango.max, "Hora de inicio");
        rellenarSelect(horaFinSelect,    rango.min, rango.max, "Hora de fin");
        ocultarError();
    }

    diaSelect.addEventListener("change", actualizarSelectsHora);

    // Cuando cambia la hora de inicio, regeneramos el select de fin
    // para que solo muestre horas que sean al menos 30 minutos después
    horaInicioSelect.addEventListener("change", () => {
        const rango  = RANGOS_DIA[diaSelect.value];
        const inicio = horaInicioSelect.value;
        if (!inicio) return;

        let minMinFin    = horaAMinutos(inicio) + 30;
        const horaMinFin = `${Math.floor((minMinFin % (24 * 60)) / 60).toString().padStart(2, "0")}:${(minMinFin % 60).toString().padStart(2, "0")}`;
        rellenarSelect(horaFinSelect, horaMinFin, rango.max, "Hora de fin");
        ocultarError();
    });

    horaFinSelect.addEventListener("change", () => {
        if (!horaInicioSelect.value || !horaFinSelect.value) return;
        const minInicio = horaAMinutos(horaInicioSelect.value);
        let   minFin    = horaAMinutos(horaFinSelect.value);
        if (minFin <= minInicio) minFin += 24 * 60; 
        if (minFin - minInicio < 30) {
            mostrarError("La hora de fin debe ser al menos 30 minutos despues del inicio.");
        } else {
            ocultarError();
        }
    });

    if (!modoEdicion) actualizarSelectsHora();

    // Tabs CLASE / ACTIVIDAD: cambian el bloque de campos visible
    tabFormBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            if (modoEdicion) return;

            tipoActivo = btn.dataset.tipo;

            tabFormBtns.forEach((b) => {
                b.classList.remove("activo");
                b.setAttribute("aria-selected", "false");
            });
            btn.classList.add("activo");
            btn.setAttribute("aria-selected", "true");

            if (tipoActivo === "clase") {
                camposClase.classList.remove("oculto");
                camposAct.classList.add("oculto");
            } else {
                camposClase.classList.add("oculto");
                camposAct.classList.remove("oculto");
            }

            form.reset();
            actualizarSelectsHora();
            ocultarError();
        });
    });

    // Muestra el mensaje de error en el párrafo #mensaje-error
    function mostrarError(texto) {
        mensajeError.textContent = texto;
        mensajeError.classList.remove("oculto");
    }

    // Oculta el mensaje de error
    function ocultarError() {
        mensajeError.textContent = "";
        mensajeError.classList.add("oculto");
    }

    // ── Submit del formulario ──────────────────────────────────
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        ocultarError();

        const nombre = document.getElementById("nombre-evento").value.trim();
        const dia    = diaSelect.value;
        const inicio = horaInicioSelect.value;
        const fin    = horaFinSelect.value;
        const estilo = document.getElementById("estilo-evento").value;

        if (!nombre) { mostrarError("El nombre del evento es obligatorio."); return; }
        if (!inicio) { mostrarError("Selecciona una hora de inicio."); return; }
        if (!fin)    { mostrarError("Selecciona una hora de fin."); return; }

        const minInicio = horaAMinutos(inicio);
        let   minFin    = horaAMinutos(fin);
        if (minFin <= minInicio) minFin += 24 * 60;

        if (minFin - minInicio < 30) {
            mostrarError("La hora de fin debe ser al menos 30 minutos despues del inicio.");
            return;
        }

        let eventosActuales    = cargarEventos();
        const eventosSinEditar = modoEdicion
            ? eventosActuales.filter((e) => e.id !== eventoEditandoId)
            : eventosActuales;

        let eventoFinal;

        if (tipoActivo === "clase") {
            const sala     = document.getElementById("sala-clase").value;
            const profesor = document.getElementById("profesor-clase").value.trim();
            const nivel    = document.getElementById("nivel-clase").value;

            if (!profesor) { mostrarError("El nombre del profesor/a es obligatorio."); return; }

            // Comprobamos si ya hay otro evento en esa sala y horario
            const solapamiento = eventosSinEditar.some((evento) =>
                evento.dia === dia &&
                ((evento.tipo === "clase"     && evento.sala      === sala) ||
                 (evento.tipo === "actividad" && evento.ubicacion === sala)) &&
                haysolapamiento(inicio, fin, evento.horaInicio, evento.horaFin)
            );

            if (solapamiento) {
                mostrarError(`La sala "${sala}" ya tiene un evento en ese horario.`);
                return;
            }

            eventoFinal = new Clase(
                modoEdicion ? eventoEditandoId : Date.now(),
                nombre, dia, inicio, fin, sala, profesor, estilo, nivel
            );

        } else {
            const ubicacion   = document.getElementById("ubicacion-actividad").value;
            const tipo        = document.getElementById("tipo-actividad").value;
            const banda       = document.getElementById("banda-actividad").value.trim();
            const profesor    = document.getElementById("profesor-actividad").value.trim();
            const descripcion = document.getElementById("descripcion-actividad").value.trim();

            const salasExclusivas = ["be-hopper", "new-orleans", "savoy"];

            if (salasExclusivas.includes(ubicacion)) {
                const solapamiento = eventosSinEditar.some((evento) =>
                    evento.dia === dia &&
                    ((evento.tipo === "clase"     && evento.sala      === ubicacion) ||
                     (evento.tipo === "actividad" && evento.ubicacion === ubicacion)) &&
                    haysolapamiento(inicio, fin, evento.horaInicio, evento.horaFin)
                );
                if (solapamiento) {
                    mostrarError(`La ubicacion "${ubicacion}" ya tiene un evento en ese horario.`);
                    return;
                }
            } else {
                const actividadesSolapadas = eventosSinEditar.filter((evento) =>
                    evento.tipo === "actividad" &&
                    evento.dia === dia &&
                    evento.ubicacion === ubicacion &&
                    haysolapamiento(inicio, fin, evento.horaInicio, evento.horaFin)
                ).length;
                if (actividadesSolapadas >= 2) {
                    mostrarError(`Ya hay 2 actividades en "${ubicacion}" en ese horario.`);
                    return;
                }
            }

            eventoFinal = new Actividad(
                modoEdicion ? eventoEditandoId : Date.now(),
                nombre, dia, inicio, fin, tipo, banda, ubicacion, profesor, estilo, descripcion
            );
        }

        if (modoEdicion) {
            const index = eventosActuales.findIndex((e) => e.id === eventoEditandoId);
            eventosActuales[index] = eventoFinal;
        } else {
            eventosActuales.push(eventoFinal);
        }

        guardarEventos(eventosActuales);
        mostrarNotificacion(
            modoEdicion ? "Evento actualizado correctamente." : "Evento registrado correctamente.",
            "exito"
        );

        setTimeout(() => { window.location.href = "/index.html#programa"; }, 1000);
    });
}

// ─────────────────────────────────────────────────────────────
//  MOSTRAR EVENTOS 
// ─────────────────────────────────────────────────────────────

function mostrarEventos() {
    const eventos = cargarEventos();
    const dias    = ["viernes", "sabado", "domingo"];
    const salas   = ["be-hopper", "new-orleans", "savoy"];

    dias.forEach((dia) => {

        const gridClases  = document.getElementById(`clases-${dia}`);
        const avisoClases = document.getElementById(`vacia-clases-${dia}`);

        // Limpiamos el grid pero conservamos las 4 cabeceras (HORA, BE HOPPER, NEW ORLEANS, SAVOY)
        limpiarGrid(gridClases, 4);

        const clasesDia = eventos
            .filter((e) => e.tipo === "clase" && e.dia === dia)
            .sort((a, b) => horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio));

        if (clasesDia.length === 0) {
            avisoClases.classList.remove("oculto");
        } else {
            avisoClases.classList.add("oculto");

            // Agrupamos las clases por franja horaria para que las que coinciden
            // en hora aparezcan en la misma fila, cada una en su columna de sala
            agruparPorFranja(clasesDia).forEach((franja) => {

                const celdaHora = document.createElement("div");
                celdaHora.className   = "grid-hora";
                celdaHora.textContent = `${franja.horaInicio} - ${franja.horaFin}`;
                gridClases.appendChild(celdaHora);

                salas.forEach((sala) => {
                    const celda = document.createElement("div");
                    celda.className       = "evento";
                    celda.dataset.dia     = dia;
                    celda.dataset.hora    = franja.horaInicio;
                    celda.dataset.horaFin = franja.horaFin;
                    celda.dataset.sala    = sala;

                    const claseEnSala = franja.eventos.find((e) => e.sala === sala);
                    if (claseEnSala) celda.appendChild(crearTarjeta(claseEnSala));

                    gridClases.appendChild(celda);
                });
            });
        }

        const gridActs  = document.getElementById(`actividades-${dia}`);
        const avisoActs = document.getElementById(`vacia-actividades-${dia}`);

        // Conservamos las 3 cabeceras (HORARIO, EVENTO, UBICACION)
        limpiarGrid(gridActs, 3);

        const actsDia = eventos
            .filter((e) => e.tipo === "actividad" && e.dia === dia)
            .sort((a, b) => horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio));

        if (actsDia.length === 0) {
            avisoActs.classList.remove("oculto");
        } else {
            avisoActs.classList.add("oculto");

            // Cada actividad ocupa una fila completa: hora | tarjeta | ubicación
            actsDia.forEach((actividad) => {
                const celdaHora = document.createElement("div");
                celdaHora.className   = "grid-hora";
                celdaHora.textContent = `${actividad.horaInicio} - ${actividad.horaFin}`;
                gridActs.appendChild(celdaHora);

                const celdaEvento = document.createElement("div");
                celdaEvento.className       = "evento";
                celdaEvento.dataset.dia     = dia;
                celdaEvento.dataset.hora    = actividad.horaInicio;
                celdaEvento.dataset.horaFin = actividad.horaFin;
                celdaEvento.appendChild(crearTarjeta(actividad));
                gridActs.appendChild(celdaEvento);

                const celdaUbic = document.createElement("div");
                celdaUbic.className   = "ubicacion";
                celdaUbic.textContent = actividad.ubicacion;
                gridActs.appendChild(celdaUbic);
            });
        }
    });
}

// Agrupa un array de clases por su franja horaria ("horaInicio-horaFin").
// Usa un Map para ir acumulando las clases de cada franja.
function agruparPorFranja(eventos) {
    const mapa = new Map();
    eventos.forEach((evento) => {
        const clave = `${evento.horaInicio}-${evento.horaFin}`;
        if (!mapa.has(clave)) {
            mapa.set(clave, { horaInicio: evento.horaInicio, horaFin: evento.horaFin, eventos: [] });
        }
        mapa.get(clave).eventos.push(evento);
    });
    return Array.from(mapa.values());
}

// Elimina todas las filas de un grid excepto las N primeras cabeceras.
// Se usa antes de redibujar para no duplicar filas.
function limpiarGrid(grid, numeroCabeceras) {
    while (grid.children.length > numeroCabeceras) {
        grid.removeChild(grid.lastChild);
    }
}

// Crea el elemento div de una tarjeta de evento con su color según el estilo de baile.
// draggable=true activa el sistema nativo de drag and drop del navegador.
function crearTarjeta(evento) {
    const tarjeta      = document.createElement("div");
    tarjeta.className  = `tarjeta-evento estilo-${evento.estilo}`;
    tarjeta.dataset.id = evento.id;
    tarjeta.draggable  = true;
    tarjeta.innerHTML  = `<span class="tarjeta-nombre">${evento.nombre}</span>`;
    return tarjeta;
}

// ─────────────────────────────────────────────────────────────
//  DRAG AND DROP
// ─────────────────────────────────────────────────────────────

function inicializarDragDrop() {
    const main = document.querySelector("main");

    main.addEventListener("dragstart", (event) => {
        const tarjeta = event.target.closest(".tarjeta-evento");
        if (!tarjeta) return;

        const idEvento = Number(tarjeta.dataset.id);
        event.dataTransfer.setData("text/plain", idEvento);

        // El setTimeout(0) es necesario porque si añadimos las zonas de drop
        // en el mismo ciclo que el dragstart, el navegador las incluye en la
        // "imagen" que se arrastra y el efecto visual queda mal
        setTimeout(() => {
            tarjeta.classList.add("dragging");
            generarZonasDropValidas(idEvento);
        }, 0);
    });

    main.addEventListener("dragend", (event) => {
        const tarjeta = event.target.closest(".tarjeta-evento");
        if (tarjeta) tarjeta.classList.remove("dragging");
        limpiarZonasDrop();
    });

    // dragover se dispara continuamente mientras el elemento está sobre una zona.
    // Necesitamos llamar a preventDefault() para permitir el drop.
    main.addEventListener("dragover", (event) => {
        const zona = event.target.closest(".zona-drop, .zona-ghost");
        if (zona) {
            event.preventDefault();
            zona.classList.add("zona-drop--hover");
        }
    });

    // Quitamos el efecto hover cuando el elemento sale de la zona
    main.addEventListener("dragleave", (event) => {
        const zona = event.target.closest(".zona-drop, .zona-ghost");
        if (zona) zona.classList.remove("zona-drop--hover");
    });

    main.addEventListener("drop", (event) => {
        event.preventDefault();

        const zona = event.target.closest(".zona-drop, .zona-ghost");
        if (!zona) return;

        zona.classList.remove("zona-drop--hover");

        const idEvento      = Number(event.dataTransfer.getData("text/plain"));
        let eventosActuales = cargarEventos();
        const eventoMovido  = eventosActuales.find((e) => e.id === idEvento);
        if (!eventoMovido) return;

        // Si se soltó en una zona fantasma, mostramos el formulario de cambio de hora
        // en lugar de mover directamente
        if (zona.classList.contains("zona-ghost")) {
            limpiarZonasDrop();
            mostrarFormularioCambioHora(eventoMovido, zona.dataset.dia, zona.dataset.sala);
            return;
        }

        const nuevoDia  = zona.dataset.dia;
        const nuevaSala = zona.dataset.sala;

        if (!validarMovimiento(eventoMovido, nuevoDia, nuevaSala, eventoMovido.horaInicio, eventoMovido.horaFin, eventosActuales)) {
            mostrarNotificacion("Esa sala ya esta ocupada en ese horario.", "error");
            return;
        }

        eventoMovido.dia = nuevoDia;
        if (eventoMovido.tipo === "clase") eventoMovido.sala = nuevaSala;

        guardarEventos(eventosActuales);
        limpiarZonasDrop();
        mostrarEventos();
        inicializarDragDrop();
        mostrarNotificacion("Evento movido correctamente.", "exito");
    });
}

// Recorre todos los grids y marca como zonas válidas de drop las celdas vacías.
// También añade una fila fantasma al final de cada tabla para poder mover
// el evento a una hora nueva
function generarZonasDropValidas(idEvento) {
    const eventos      = cargarEventos();
    const eventoMovido = eventos.find((e) => e.id === idEvento);
    if (!eventoMovido) return;

    const dias  = ["viernes", "sabado", "domingo"];
    const salas = ["be-hopper", "new-orleans", "savoy"];

    if (eventoMovido.tipo === "clase") {
        dias.forEach((dia) => {
            const grid = document.getElementById(`clases-${dia}`);
            if (!grid) return;

            // Resaltamos las celdas que no tienen tarjeta dentro
            grid.querySelectorAll(".evento:not(:has(.tarjeta-evento))").forEach((celda) => {
                celda.classList.add("zona-drop");
                celda.dataset.dia = dia;
            });

            // Solo añadimos la fila fantasma si ya hay filas de datos en el grid
            // (más de las 4 cabeceras), para ofrecer la opción de nueva hora
            if (grid.children.length > 4) {
                grid.appendChild(crearFilaGhost(dia, salas));
            }
        });

    } else if (eventoMovido.tipo === "actividad") {
        dias.forEach((dia) => {
            const grid = document.getElementById(`actividades-${dia}`);
            if (!grid || grid.children.length <= 3) return;

            // Para actividades creamos una zona fantasma que ocupa toda la fila
            const ghost = document.createElement("div");
            ghost.className        = "zona-ghost zona-ghost--actividad";
            ghost.dataset.dia      = dia;
            ghost.textContent      = "+ Mover aqui (nueva hora)";
            ghost.style.gridColumn = "1 / -1"; // ocupa las 3 columnas del grid
            grid.appendChild(ghost);
        });
    }
}

// Crea la fila fantasma al final del grid de clases.
// Tiene una celda de "Nueva hora" y una celda zona-ghost por cada sala.
// Usamos un DocumentFragment para construirla en memoria antes de añadirla al DOM
function crearFilaGhost(dia, salas) {
    const fragment  = document.createDocumentFragment();

    const celdaHora = document.createElement("div");
    celdaHora.className   = "grid-hora zona-ghost-hora";
    celdaHora.textContent = "Nueva hora";
    fragment.appendChild(celdaHora);

    salas.forEach((sala) => {
        const celda = document.createElement("div");
        celda.className    = "zona-ghost";
        celda.dataset.dia  = dia;
        celda.dataset.sala = sala;
        celda.textContent  = "+";
        fragment.appendChild(celda);
    });

    // El wrapper con display:contents hace que sus hijos participen directamente
    // en el grid del padre, como si el wrapper no existiera
    const wrapper = document.createElement("div");
    wrapper.className     = "ghost-row";
    wrapper.style.display = "contents";
    wrapper.dataset.ghost = "true";
    wrapper.appendChild(fragment);

    return wrapper;
}

// Muestra el formulario inline de cambio de hora cuando se suelta un evento
// en una zona fantasma. El formulario se inserta justo después del grid.
function mostrarFormularioCambioHora(eventoMovido, nuevoDia, nuevaSala) {
    // Si ya hay un formulario abierto lo eliminamos antes de crear uno nuevo
    document.getElementById("form-cambio-hora")?.remove();

    // Insertamos el formulario debajo del grid correspondiente al tipo de evento
    const contenedor = eventoMovido.tipo === "clase"
        ? document.getElementById(`clases-${nuevoDia}`)
        : document.getElementById(`actividades-${nuevoDia}`);
    if (!contenedor) return;

    const rango = RANGOS_DIA[nuevoDia];

    const opciones = generarOpcionesHora(rango.min, rango.max)
        .map((h) => `<option value="${h}" ${h === eventoMovido.horaInicio ? "selected" : ""}>${h}</option>`)
        .join("");

    const formHTML = `
        <div id="form-cambio-hora" class="form-cambio-hora" style="grid-column: 1 / -1">
            <p class="form-cambio-titulo">Nueva hora para <strong>${eventoMovido.nombre}</strong></p>
            <div class="form-cambio-campos">
                <div>
                    <label for="nueva-hora-inicio">Inicio</label>
                    <select id="nueva-hora-inicio">${opciones}</select>
                </div>
                <div>
                    <label for="nueva-hora-fin">Fin</label>
                    <select id="nueva-hora-fin">${opciones}</select>
                </div>
                <button id="confirmar-cambio-hora" class="btn-confirmar">CONFIRMAR</button>
                <button id="cancelar-cambio-hora" class="btn-cancelar">CANCELAR</button>
            </div>
            <p id="error-cambio-hora" class="form-error oculto"></p>
        </div>
    `;

    contenedor.insertAdjacentHTML("afterend", formHTML);

    const nuevoInicioSelect = document.getElementById("nueva-hora-inicio");
    const nuevoFinSelect    = document.getElementById("nueva-hora-fin");

    // Al cambiar el inicio, regeneramos el fin igual que en el formulario principal
    nuevoInicioSelect.addEventListener("change", () => {
        const inicio     = nuevoInicioSelect.value;
        let minMinFin    = horaAMinutos(inicio) + 30;
        const horaMinFin = `${Math.floor((minMinFin % (24 * 60)) / 60).toString().padStart(2, "0")}:${(minMinFin % 60).toString().padStart(2, "0")}`;
        rellenarSelect(nuevoFinSelect, horaMinFin, rango.max, "Hora de fin");
    });

    // Inicializamos el select de fin en función de la hora de inicio preseleccionada
    const inicioActual = nuevoInicioSelect.value;
    let minMinFin      = horaAMinutos(inicioActual) + 30;
    const horaMinFin   = `${Math.floor((minMinFin % (24 * 60)) / 60).toString().padStart(2, "0")}:${(minMinFin % 60).toString().padStart(2, "0")}`;
    rellenarSelect(nuevoFinSelect, horaMinFin, rango.max, "Hora de fin");

    // Cancelar: eliminamos el formulario y redibujamos el calendario
    document.getElementById("cancelar-cambio-hora").addEventListener("click", () => {
        document.getElementById("form-cambio-hora")?.remove();
        mostrarEventos();
        inicializarDragDrop();
    });

    // Confirmar: validamos y guardamos el cambio de hora
    document.getElementById("confirmar-cambio-hora").addEventListener("click", () => {
        const nuevoInicio = nuevoInicioSelect.value;
        const nuevoFin    = nuevoFinSelect.value;
        const errorEl     = document.getElementById("error-cambio-hora");

        if (!nuevoInicio) {
            errorEl.textContent = "Selecciona una hora de inicio.";
            errorEl.classList.remove("oculto");
            return;
        }

        if (!nuevoFin) {
            errorEl.textContent = "Selecciona una hora de fin.";
            errorEl.classList.remove("oculto");
            return;
        }

        const minInicio = horaAMinutos(nuevoInicio);
        let   minFin    = horaAMinutos(nuevoFin);
        if (minFin <= minInicio) minFin += 24 * 60;

        if (minFin - minInicio < 30) {
            errorEl.textContent = "La duracion minima es 30 minutos.";
            errorEl.classList.remove("oculto");
            return;
        }

        let eventosActuales = cargarEventos();

        if (!validarMovimiento(eventoMovido, nuevoDia, nuevaSala, nuevoInicio, nuevoFin, eventosActuales)) {
            errorEl.textContent = "Esa sala ya esta ocupada en el horario indicado.";
            errorEl.classList.remove("oculto");
            return;
        }

        // Actualizamos el evento en el array y guardamos
        const eventoActualizar = eventosActuales.find((e) => e.id === eventoMovido.id);
        eventoActualizar.dia        = nuevoDia;
        eventoActualizar.horaInicio = nuevoInicio;
        eventoActualizar.horaFin    = nuevoFin;
        if (eventoActualizar.tipo === "clase") eventoActualizar.sala = nuevaSala;

        guardarEventos(eventosActuales);
        document.getElementById("form-cambio-hora")?.remove();
        mostrarEventos();
        inicializarDragDrop();
        mostrarNotificacion("Evento movido correctamente.", "exito");
    });
}

// Comprueba si el movimiento de un evento a un nuevo día/sala/hora es válido.
// Para clases: la sala nueva no puede estar ocupada en ese horario.
// Para actividades en salas exclusivas: igual que clases.
// Para actividades en ubicaciones externas: se permiten hasta 2 simultáneas.
function validarMovimiento(eventoMovido, nuevoDia, nuevaSala, nuevoInicio, nuevoFin, eventosActuales) {
    const salasExclusivas = ["be-hopper", "new-orleans", "savoy"];

    if (eventoMovido.tipo === "clase") {
        return !eventosActuales.some((evento) =>
            evento.id !== eventoMovido.id &&
            evento.dia === nuevoDia &&
            ((evento.tipo === "clase"     && evento.sala      === nuevaSala) ||
             (evento.tipo === "actividad" && evento.ubicacion === nuevaSala)) &&
            haysolapamiento(nuevoInicio, nuevoFin, evento.horaInicio, evento.horaFin)
        );
    }

    if (eventoMovido.tipo === "actividad") {
        const nuevaUbicacion = eventoMovido.ubicacion;

        if (salasExclusivas.includes(nuevaUbicacion)) {
            return !eventosActuales.some((evento) =>
                evento.id !== eventoMovido.id &&
                evento.dia === nuevoDia &&
                ((evento.tipo === "clase"     && evento.sala      === nuevaUbicacion) ||
                 (evento.tipo === "actividad" && evento.ubicacion === nuevaUbicacion)) &&
                haysolapamiento(nuevoInicio, nuevoFin, evento.horaInicio, evento.horaFin)
            );
        } else {
            return eventosActuales.filter((evento) =>
                evento.id !== eventoMovido.id &&
                evento.tipo === "actividad" &&
                evento.dia === nuevoDia &&
                evento.ubicacion === nuevaUbicacion &&
                haysolapamiento(nuevoInicio, nuevoFin, evento.horaInicio, evento.horaFin)
            ).length < 2;
        }
    }

    return false;
}

// Elimina del DOM todas las zonas de drop y las filas fantasma
// que se generaron al empezar el arrastre
function limpiarZonasDrop() {
    document.querySelectorAll(".zona-drop").forEach((el) => el.classList.remove("zona-drop", "zona-drop--hover"));
    document.querySelectorAll(".zona-ghost, .zona-ghost-hora").forEach((el) => el.remove());
    document.querySelectorAll(".ghost-row").forEach((el) => el.remove());
}

// ─────────────────────────────────────────────────────────────
//  MODALES
// ─────────────────────────────────────────────────────────────

let eventoIdActivo = null;

function inicializarModales() {
    const contenedorPrincipal = document.querySelector("main");

    contenedorPrincipal.addEventListener("click", (event) => {
        // closest busca el ancestro más cercano que coincida con el selector
        const tarjetaClic = event.target.closest(".tarjeta-evento");
        if (!tarjetaClic) return;

        const idEvento           = Number(tarjetaClic.dataset.id);
        const eventoSeleccionado = cargarEventos().find((e) => e.id === idEvento);
        if (!eventoSeleccionado) return;

        eventoIdActivo = eventoSeleccionado.id;

        if (eventoSeleccionado.tipo === "clase") {
            abrirModalClase(eventoSeleccionado);
        } else {
            abrirModalActividad(eventoSeleccionado);
        }
    });

    // Botón Cerrar: oculta ambos modales y limpia el ID activo
    document.querySelectorAll(".btn-cerrar").forEach((boton) => {
        boton.addEventListener("click", () => {
            document.querySelector("#modal-clase").classList.remove("visible");
            document.querySelector("#modal-actividad").classList.remove("visible");
            eventoIdActivo = null;
        });
    });

    // Botón Editar: redirige a registro.html pasando el ID por la URL
    document.querySelectorAll(".btn-editar").forEach((boton) => {
        boton.addEventListener("click", () => {
            if (!eventoIdActivo) return;
            window.location.href = `/registro.html?editar=${eventoIdActivo}`;
        });
    });

    // Botón Eliminar: borra el evento de localStorage y actualiza el calendario
    document.querySelectorAll(".btn-borrar").forEach((boton) => {
        boton.addEventListener("click", () => {
            if (!eventoIdActivo) return;

            // Filtramos todos los eventos excepto el que queremos borrar
            const eventosActuales = cargarEventos().filter((e) => e.id !== eventoIdActivo);
            guardarEventos(eventosActuales);

            document.querySelector("#modal-clase").classList.remove("visible");
            document.querySelector("#modal-actividad").classList.remove("visible");

            mostrarEventos();
            inicializarDragDrop();
            mostrarNotificacion("Evento eliminado.", "info");
        });
    });
}

// Rellena el modal de clase con los datos del evento y lo hace visible
function abrirModalClase(clase) {
    document.getElementById("modal-clase-titulo").textContent     = clase.nombre;
    document.getElementById("modal-clase-dia").textContent        = clase.dia;
    document.getElementById("modal-clase-hora").textContent       = `${clase.horaInicio} - ${clase.horaFin}`;
    document.getElementById("modal-clase-ubicacion").textContent  = clase.sala;
    document.getElementById("modal-clase-profesores").textContent = clase.profesor;
    document.getElementById("modal-clase-estilo").textContent     = clase.estilo;
    document.getElementById("modal-clase-nivel").textContent      = clase.nivel;
    document.getElementById("modal-clase").classList.add("visible");
}

// Rellena el modal de actividad con los datos del evento y lo hace visible.
// Los campos opcionales (profesor, banda, descripción) se muestran u ocultan
// según si el evento tiene ese dato o no.
function abrirModalActividad(actividad) {
    document.getElementById("modal-actividad-titulo").textContent    = actividad.nombre;
    document.getElementById("modal-actividad-dia").textContent       = actividad.dia;
    document.getElementById("modal-actividad-hora").textContent      = `${actividad.horaInicio} - ${actividad.horaFin}`;
    document.getElementById("modal-actividad-ubicacion").textContent = actividad.ubicacion;
    document.getElementById("modal-actividad-estilo").textContent    = actividad.estilo;

    const pProfesor    = document.getElementById("p-actividad-profesores");
    const pBanda       = document.getElementById("p-actividad-banda");
    const pDescripcion = document.getElementById("p-actividad-descripcion");

    if (actividad.profesor) {
        document.getElementById("modal-actividad-profesores").textContent = actividad.profesor;
        pProfesor.style.display = "block";
    } else {
        pProfesor.style.display = "none";
    }

    if (actividad.banda) {
        document.getElementById("modal-actividad-banda").textContent = actividad.banda;
        pBanda.style.display = "block";
    } else {
        pBanda.style.display = "none";
    }

    if (actividad.descripcion) {
        document.getElementById("modal-actividad-descripcion").textContent = actividad.descripcion;
        pDescripcion.style.display = "block";
    } else {
        pDescripcion.style.display = "none";
    }

    document.getElementById("modal-actividad").classList.add("visible");
}