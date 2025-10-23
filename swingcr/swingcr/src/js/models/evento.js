const DIAS_PERMITIDOS = ['viernes', 'sabado', 'domingo'];
const ESTILOS_PERMITIDOS = ['lindy-hop', 'shag', 'solo-jazz'];
const HORARIOS_PERMITIDOS = {
    viernes: ['20:00-21:30', '21:30-23:00', '23:00-00:30'],
    sabado: ['10:30-12:00', '12:00-14:00', '16:30-17:30', '17:30-19:00', '19:00-20:30', '20:30-22:00', '22:00-23:30', '23:30-01:00', '01:00-03:00'],
    domingo: ['10:30-12:00', '12:00-14:00', '16:00-17:30', '17:30-19:00', '19:00-20:00']
}

export class Clase {

    static SALAS_PERMITIDAS = ['be-hopper', 'new-orleans', 'savoy'];
    static NIVELES_PERMITIDOS = ['basico', 'intermedio', 'avanzado'];

    constructor(id, nombre, dia, hora, sala, profesor, estilo, nivel) {
        
        if (!DIAS_PERMITIDOS.includes(dia)) {
            throw new Error(`Día inválido: "${dia}"`);
        }

        if (!HORARIOS_PERMITIDOS[dia].includes(hora)) {
            throw new Error(`Hora inválida: "${hora}" para el dia "${dia}"`);
        }

        if (!Clase.SALAS_PERMITIDAS.includes(sala)) {
            throw new Error(`Sala inválida: "${sala}"`);
        }

        if (!ESTILOS_PERMITIDOS.includes(estilo)) {
            throw new Error(`Estilo inválido: "${estilo}"`);
        }

        if (!Clase.NIVELES_PERMITIDOS.includes(nivel)) {
            throw new Error(`Nivel inválido: "${nivel}"`);
        }

        this.id = id;
        this.tipo = 'clase';
        this.nombre = nombre;
        this.dia = dia;
        this.hora = hora;
        this.sala = sala;
        this.profesor = profesor;
        this.estilo = estilo;
        this.nivel = nivel;
    }
}

export class Actividad {
    
    static TIPO_PERMITIDO = ['taster', 'social', 'concierto', 'mix-match'];
    static UBICACION_PERMITIDA = ['be-hopper', 'new-orleans', 'savoy', 'antiguo-casino', 'parque-de-gasset', 'prado'];

    constructor(id, nombre, dia, hora, tipoActividad, banda, ubicacion, profesor, estilo, descripcion){
        
        if (!DIAS_PERMITIDOS.includes(dia)) {
            throw new Error(`Día inválido: "${dia}"`);
        }

        if (!HORARIOS_PERMITIDOS[dia].includes(hora)) {
            throw new Error(`Hora inválida: "${hora}" para el dia "${dia}"`);
        }

        if (!ESTILOS_PERMITIDOS.includes(estilo)) {
            throw new Error(`Estilo inválido: "${estilo}"`);
        }

        if (!Actividad.TIPO_PERMITIDO.includes(tipoActividad)){
            throw new Error(`Tipo inválido: "${tipoA}"`);
        }
        
        if (!Actividad.UBICACION_PERMITIDA.includes(ubicacion)) {
            throw new Error(`Ubicacion inválida: "${ubicacion}"`);
        }
        
        this.id = id;
        this.tipo = 'actividad';
        this.nombre = nombre;
        this.dia = dia;
        this.hora = hora;
        this.tipoActividad = tipoActividad;
        this.banda = banda;
        this.ubicacion = ubicacion;
        this.profesor = profesor;
        this.estilo = estilo;
        this.descripcion = descripcion;
    }

}