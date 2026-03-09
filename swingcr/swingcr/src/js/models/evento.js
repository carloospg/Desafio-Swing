// Valores validos para dia y estilo, usados en las validaciones de los constructores
const DIAS_PERMITIDOS = ["viernes", "sabado", "domingo"];
const ESTILOS_PERMITIDOS = ["lindy-hop", "shag", "solo-jazz"];

// Convierte una hora en formato "HH:MM" a minutos desde medianoche
// Ejemplo: "20:30" → 1230
// Se usa para poder comparar horas numericamente
export function horaAMinutos(hora) {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}

// Comprueba si dos rangos de hora se solapan
// Recibe cuatro strings "HH:MM": inicio y fin del evento 1, inicio y fin del evento 2
// El caso especial es cuando un evento cruza la medianoche (ej: 23:00 - 01:00):
// si fin <= inicio, significa que termina al dia siguiente, asi que sumo 24h
export function haysolapamiento(inicio1, fin1, inicio2, fin2) {
    let min1 = horaAMinutos(inicio1);
    let max1 = horaAMinutos(fin1);
    let min2 = horaAMinutos(inicio2);
    let max2 = horaAMinutos(fin2);

    // Correccion de cruce de medianoche para cada rango
    if (max1 <= min1) max1 += 24 * 60;
    if (max2 <= min2) max2 += 24 * 60;

    // Dos rangos se solapan si uno empieza antes de que el otro termine
    return min1 < max2 && min2 < max1;
}

export class Clase {

    // Valores validos como propiedades estaticas de la clase
    static SALAS_PERMITIDAS   = ["be-hopper", "new-orleans", "savoy"];
    static NIVELES_PERMITIDOS = ["basico", "intermedio", "avanzado"];

    constructor(id, nombre, dia, horaInicio, horaFin, sala, profesor, estilo, nivel) {

        if (!DIAS_PERMITIDOS.includes(dia)) {
            throw new Error(`Dia invalido: "${dia}"`);
        }

        if (!Clase.SALAS_PERMITIDAS.includes(sala)) {
            throw new Error(`Sala invalida: "${sala}"`);
        }

        if (!ESTILOS_PERMITIDOS.includes(estilo)) {
            throw new Error(`Estilo invalido: "${estilo}"`);
        }

        if (!Clase.NIVELES_PERMITIDOS.includes(nivel)) {
            throw new Error(`Nivel invalido: "${nivel}"`);
        }

        const minInicio = horaAMinutos(horaInicio);
        let   minFin    = horaAMinutos(horaFin);
        if (minFin <= minInicio) minFin += 24 * 60;

        if (minFin <= minInicio) {
            throw new Error(`La hora de fin debe ser posterior a la de inicio.`);
        }

        this.id         = id;
        this.tipo       = "clase";
        this.nombre     = nombre;
        this.dia        = dia;
        this.horaInicio = horaInicio;
        this.horaFin    = horaFin;
        this.sala       = sala;
        this.profesor   = profesor;
        this.estilo     = estilo;
        this.nivel      = nivel;
    }
}

export class Actividad {

    static TIPOS_PERMITIDOS      = ["taster", "social", "concierto", "mix-match"];
    static UBICACIONES_PERMITIDAS = [
        "be-hopper", "new-orleans", "savoy",
        "antiguo-casino", "parque-de-gasset", "prado",
    ];

    constructor(id, nombre, dia, horaInicio, horaFin, tipoActividad, banda, ubicacion, profesor, estilo, descripcion) {

        if (!DIAS_PERMITIDOS.includes(dia)) {
            throw new Error(`Dia invalido: "${dia}"`);
        }

        if (!ESTILOS_PERMITIDOS.includes(estilo)) {
            throw new Error(`Estilo invalido: "${estilo}"`);
        }

        if (!Actividad.TIPOS_PERMITIDOS.includes(tipoActividad)) {
            throw new Error(`Tipo invalido: "${tipoActividad}"`);
        }

        if (!Actividad.UBICACIONES_PERMITIDAS.includes(ubicacion)) {
            throw new Error(`Ubicacion invalida: "${ubicacion}"`);
        }

        const minInicio = horaAMinutos(horaInicio);
        let   minFin    = horaAMinutos(horaFin);
        if (minFin <= minInicio) minFin += 24 * 60;

        if (minFin <= minInicio) {
            throw new Error(`La hora de fin debe ser posterior a la de inicio.`);
        }

        this.id             = id;
        this.tipo           = "actividad";
        this.nombre         = nombre;
        this.dia            = dia;
        this.horaInicio     = horaInicio;
        this.horaFin        = horaFin;
        this.tipoActividad  = tipoActividad;
        this.banda          = banda;
        this.ubicacion      = ubicacion;
        this.profesor       = profesor;
        this.estilo         = estilo;
        this.descripcion    = descripcion;
    }
}