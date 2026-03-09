import { Clase, Actividad } from "../models/evento.js";

// Clave con la que se guardan los datos en localStorage
const EVENTOS_KEY = "swing_cr_eventos";

// Guarda el array de eventos en localStorage
export function guardarEventos(eventos) {
    localStorage.setItem(EVENTOS_KEY, JSON.stringify(eventos));
}

export function cargarEventos() {
    const eventosGuardados = localStorage.getItem(EVENTOS_KEY);

    if (!eventosGuardados) return [];

    const datos = JSON.parse(eventosGuardados);

    return datos.map((dato) => {
        if (dato.tipo === "clase") {
            return new Clase(
                dato.id, dato.nombre, dato.dia,
                dato.horaInicio, dato.horaFin,
                dato.sala, dato.profesor, dato.estilo, dato.nivel,
            );
        } else {
            return new Actividad(
                dato.id, dato.nombre, dato.dia,
                dato.horaInicio, dato.horaFin,
                dato.tipoActividad, dato.banda, dato.ubicacion,
                dato.profesor, dato.estilo, dato.descripcion,
            );
        }
    });
}