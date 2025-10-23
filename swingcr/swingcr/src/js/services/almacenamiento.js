const EVENTOS_KEY = 'swing_cr_eventos';

export function guardarEventos(eventos){
    localStorage.setItem(EVENTOS_KEY, JSON.stringify(eventos));
}

export function cargarEventos() {
    const eventosGuardados = localStorage.getItem(EVENTOS_KEY);

    if (eventosGuardados) {
        return JSON.parse(eventosGuardados);
    }

    return [];
}