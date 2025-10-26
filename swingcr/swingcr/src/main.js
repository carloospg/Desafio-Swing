import './css/style.css';
import { Clase, Actividad } from './js/models/evento.js';
import { guardarEventos, cargarEventos } from './js/services/almacenamiento.js';

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#form-clase')) {
        inicializarFormularios();
    }
    if (document.querySelector('#horario-clases')) {
        mostrarEventos();
        inicializarModales();
        inicializarDragDrop();
    }
});

function inicializarFormularios() {
    const horariosDisponibles = {
        viernes: ['20:00-21:30', '21:30-23:00', '23:00-00:30'],
        sabado: ['10:30-12:00', '12:00-14:00', '16:30-17:30', '17:30-19:00', '19:00-20:30', '20:30-22:00', '22:00-23:30', '23:30-01:00', '01:00-03:00'],
        domingo: ['10:30-12:00', '12:00-14:00', '16:00-17:30', '17:30-19:00', '19:00-20:00']
    };

    // formulario clase

    const diaClaseSelect = document.getElementById('dia-clase');
    const horasClaseSelect = document.getElementById('horas-clase');
    const formClase = document.getElementById('form-clase');

    function actualizarHorasClase() {
        const diaSeleccionado = diaClaseSelect.value;
        const horasDelDia = horariosDisponibles[diaSeleccionado];
        horasClaseSelect.innerHTML = '';
        horasDelDia.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            horasClaseSelect.appendChild(option);
        });
        horasClaseSelect.disabled = false;
    }
    diaClaseSelect.addEventListener('change', actualizarHorasClase);
    actualizarHorasClase();

    formClase.addEventListener('submit', (event) => {
        event.preventDefault();

        const dia = diaClaseSelect.value;
        const hora = horasClaseSelect.value;
        const sala = document.getElementById('sala-clase').value;

        const eventosActuales = cargarEventos();

        const salaOcupada = eventosActuales.some(evento =>
            evento.tipo === 'clase' &&
            evento.dia === dia && 
            evento.hora === hora &&
            evento.sala === sala
        )

        if (salaOcupada) {
            console.log('La sala ya está ocupada');
            return;
        }

        const nuevaClase = new Clase(
            Date.now(),
            document.getElementById('nombre-clase').value,
            dia,
            hora,
            sala,
            document.getElementById('profesor-clase').value,
            document.getElementById('estilo-clase').value,
            document.getElementById('nivel-clase').value
        );

        eventosActuales.push(nuevaClase);
        guardarEventos(eventosActuales);

        console.log('Clase registrada');

        formClase.reset();
        actualizarHorasClase();
    });

    const diaActividadSelect = document.getElementById('dia-actividad');
    const horasActividadSelect = document.getElementById('horas-actividad');
    const formActividad = document.getElementById('form-actividad');

    function actualizarHorasActividad() {
        const diaSeleccionado = diaActividadSelect.value;
        const horasDelDia = horariosDisponibles[diaSeleccionado];
        horasActividadSelect.innerHTML = '';
        horasDelDia.forEach(hora => { 
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = hora;
            horasActividadSelect.appendChild(option);
        });
        horasActividadSelect.disabled = false;
    }
    diaActividadSelect.addEventListener('change', actualizarHorasActividad); 
    actualizarHorasActividad();
    
    formActividad.addEventListener('submit', (event) => {
        event.preventDefault();

        const dia = diaActividadSelect.value;
        const hora = horasActividadSelect.value;
        const ubicacion = document.getElementById('ubicacion-actividad').value;
    
        const salasExclusivas = ['be-hopper', 'new-orleans', 'savoy'];

        const eventosActuales = cargarEventos();
        
        if (salasExclusivas.includes(ubicacion)){
            const salaOcupada = eventosActuales.some(evento => 
            (evento.dia === dia && evento.hora === hora) &&
            ((evento.tipo === 'clase' && evento.sala === ubicacion) ||
            (evento.tipo === 'actividad' && evento.ubicacion === ubicacion))
            );

            if (salaOcupada) {
                console.log('La sala ya esta ocupada');
                return;
            }
        } else {
            const actividadMismoLugar = eventosActuales.filter(evento =>
                evento.tipo === 'actividad' &&
                evento.dia === dia &&
                evento.hora === hora &&
                evento.ubicacion === ubicacion
            ).length;

            if (actividadMismoLugar >= 2) {
                console.log('No se pueden hacer mas eventos en esta ubicacion a esa hora');
                return;
            }
        }

        const nuevaActividad = new Actividad(
            Date.now(),
            document.getElementById('nombre-actividad').value,
            dia,
            hora,
            document.getElementById('tipo-actividad').value,
            document.getElementById('banda-actividad').value,
            ubicacion,
            document.getElementById('profesor-actividad').value,
            document.getElementById('estilo-actividad').value,
            document.getElementById('descripcion-actividad').value
        );

        eventosActuales.push(nuevaActividad);
        guardarEventos(eventosActuales);

        console.log('Actividad registrada');
        formActividad.reset();
        actualizarHorasActividad();
    });
}

let eventoIdBorrar = null;

function mostrarEventos() {
    const eventos = cargarEventos();
   
    document.querySelectorAll('.grid-horario-clases .evento').forEach(slot => {
        slot.innerHTML = '';
        slot.className = 'evento';
    });

    document.querySelectorAll('.grid-horario-actividades .evento, .grid-horario-actividades .ubicacion').forEach(slot => {
        slot.innerHTML = '';
        if (slot.classList.contains('evento')) {
            slot.className = 'evento';
        } else {
            slot.className = 'ubicacion';
        }
    });

    eventos.forEach(evento => {
        if (evento.tipo === 'clase') {
            const selector = `.grid-horario-clases .evento[data-dia="${evento.dia}"][data-hora="${evento.hora.split('-')[0]}"][data-sala="${evento.sala}"]`;
            const slotDestino = document.querySelector(selector);

            if (slotDestino) {
                const tarjetaClase = document.createElement('div');
                tarjetaClase.className = ('tarjeta-evento');
                tarjetaClase.classList.add(`estilo-${evento.estilo}`);
                tarjetaClase.textContent = evento.nombre;
                tarjetaClase.dataset.id = evento.id;

                tarjetaClase.draggable = true;

                slotDestino.appendChild(tarjetaClase);
            }

        } else if (evento.tipo === 'actividad') {
            const selectorEvento = `.grid-horario-actividades .evento[data-dia="${evento.dia}"][data-hora="${evento.hora.split('-')[0]}"]`;
            const slotEvento = document.querySelector(selectorEvento);

            const selectorUbicacion = `.grid-horario-actividades .ubicacion[data-dia="${evento.dia}"][data-hora="${evento.hora.split('-')[0]}"]`;
            const slotUbicacion = document.querySelector(selectorUbicacion);


            if (slotEvento && slotUbicacion) {
                const tarjetaActividad = document.createElement('div');
                tarjetaActividad.className = 'tarjeta-evento';
                tarjetaActividad.classList.add(`tipo-${evento.tipoActividad}`);
                tarjetaActividad.textContent = evento.nombre;
                tarjetaActividad.dataset.id = evento.id;
                
                tarjetaActividad.draggable = true;

                slotEvento.appendChild(tarjetaActividad);

                const tarjetaUbicacion = document.createElement('div');
                tarjetaUbicacion.className = 'tarjeta-evento';
                tarjetaUbicacion.classList.add(`tipo-${evento.tipoActividad}`)
                tarjetaUbicacion.textContent = evento.ubicacion;
                tarjetaUbicacion.dataset.id = evento.id;

                tarjetaUbicacion.draggable = true;
                
                slotUbicacion.appendChild(tarjetaUbicacion);
            }

        }

    });

}

function inicializarModales() {
    const contenedorPrincipal = document.querySelector('main');

    contenedorPrincipal.addEventListener('click', (event) => {
        const tarjetaClic = event.target.closest('.tarjeta-evento');
        if (!tarjetaClic){
            return;
        }

        const idEvento = Number(tarjetaClic.dataset.id);
        const eventos = cargarEventos();
        const eventoSeleccionado = eventos.find( e => e.id == idEvento);
        if (!eventoSeleccionado) {
            return;
        }

        eventoIdBorrar = eventoSeleccionado.id;

        if (eventoSeleccionado.tipo === 'clase'){
            abrirModalClase(eventoSeleccionado);
        } else {
            abrirModalActividad(eventoSeleccionado);
        }
    });

    document.querySelectorAll('#modal-cerrar').forEach(boton => {
        boton.addEventListener('click', () => {
            document.querySelector('#modal-clase').classList.remove('visible');
            document.querySelector('#modal-actividad').classList.remove('visible');
            eventoIdBorrar = null;
        });
    });

    document.querySelectorAll('#modal-borrar').forEach(boton => {
        boton.addEventListener('click', () => {
            if (!eventoIdBorrar) {
                return;
            }

            let eventosActuales = cargarEventos();

            eventosActuales = eventosActuales.filter(e => e.id !== eventoIdBorrar);

            guardarEventos(eventosActuales);

            document.querySelector('#modal-clase').classList.remove('visible');
            document.querySelector('#modal-actividad').classList.remove('visible');

            mostrarEventos();
        });
    });
}

function inicializarDragDrop() {
    const contenedorTablas = document.querySelector('main');

    contenedorTablas.addEventListener('dragstart', (event) => {
        if(event.target.classList.contains('tarjeta-evento')) {
            event.dataTransfer.setData('text/plain', event.target.dataset.id);

            setTimeout(() =>{
                event.target.classList.add('dragging');
            }, 0);
        }
    });

    contenedorTablas.addEventListener('dragend', (event) => {
        if(event.target.classList.contains('tarjeta-evento')){
            event.target.classList.remove('dragging');
        }
    });

    contenedorTablas.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    contenedorTablas.addEventListener('drop', (event) => {
        event.preventDefault();

        const celdaDestino = event.target.closest('.evento, .ubicacion');

        if (!celdaDestino) {
            return
        }

        const idEvento = Number(event.dataTransfer.getData('text/plain'));

        let eventosActuales = cargarEventos();

        const eventoMovido = eventosActuales.find(e => e.id === idEvento);

        if(!eventoMovido) {
            return;
        }

        const nuevoDia = celdaDestino.dataset.dia;
        const nuevaSala = celdaDestino.dataset.sala;

        let elementoHora = celdaDestino.previousElementSibling;

        while (elementoHora && !elementoHora.classList.contains('grid-hora')){
            elementoHora = elementoHora.previousElementSibling;
        }
     
        const nuevaHora = elementoHora ? elementoHora.textContent.trim() : eventoMovido.hora;
        
        if(eventoMovido.tipo === 'clase'){    
            if (!nuevaSala) {
                console.log('Solo puedes ponerlo en las tablas de las clases');
                return;
            }

            const salaOcupada = eventosActuales.some(evento =>
                evento.id !== idEvento &&
                evento.dia === nuevoDia &&
                evento.hora === nuevaHora &&
                ((evento.tipo === 'clase' && evento.sala === nuevaSala) || (evento.tipo === 'actividad' && evento.ubicacion === nuevaSala))
            );
    
            if (salaOcupada) {
                console.log('La sala ya esta ocupada a esa hora');
                return;
            }
            
        } else if (eventoMovido.tipo === 'actividad') {
            const salasExclusivas = ['be-hopper', 'new-orleans', 'savoy'];
            const nuevaUbicacion = nuevaSala || eventoMovido.ubicacion;

            if (nuevaSala) {
                console.log('Solo puedes ponerlo en las tablas de las actividades');
                return;
            }

            if (salasExclusivas.includes(nuevaUbicacion)) {
                const salaOcupadaActividad = eventosActuales.some(evento =>
                    evento.id !== idEvento &&
                    evento.dia === nuevoDia &&
                    evento.hora === nuevaHora &&
                    ((evento.tipo === 'clase' && evento.sala === nuevaUbicacion) || (evento.tipo === 'actividad' && evento.ubicacion === nuevaUbicacion))
                );

                if (salaOcupadaActividad) {
                    console.log('Esta sala ya esta ocupada');
                    return;
                }
            } else {
                const actividadesMismoLugar = eventosActuales.filter(evento =>
                    evento.id !== idEvento &&
                    evento.tipo === 'actividad' &&
                    evento.dia === nuevoDia &&
                    evento.hora === nuevaHora &&
                    evento.ubicacion === nuevaUbicacion
                ).length;

                if(actividadesMismoLugar >= 2) {
                    console.log('Ya hay dos dos actividades en esa ubicacion y horas');
                    return;
                }
            }
        }

        eventoMovido.dia = nuevoDia;
        eventoMovido.hora = nuevaHora;

        if (eventoMovido.tipo === 'clase') {
            eventoMovido.sala = nuevaSala;
        } else if (eventoMovido.tipo === 'actividad' && nuevaSala){
            eventoMovido.ubicacion = nuevaSala;
        }

        guardarEventos(eventosActuales);

        mostrarEventos();
    });
}

function abrirModalClase(clase){
    document.getElementById('modal-clase-titulo').textContent = clase.nombre;
    document.getElementById('modal-clase-dia').textContent = clase.dia;
    document.getElementById('modal-clase-hora').textContent = clase.hora;
    document.getElementById('modal-clase-ubicacion').textContent = clase.sala;
    document.getElementById('modal-clase-profesores').textContent = clase.profesor;
    document.getElementById('modal-clase-estilo').textContent = clase.estilo;
    document.getElementById('modal-clase-nivel').textContent = clase.nivel;
    document.getElementById('modal-clase').classList.add('visible');
}

function abrirModalActividad(actividad){
    document.getElementById('modal-actividad-titulo').textContent = actividad.nombre;
    document.getElementById('modal-actividad-dia').textContent = actividad.dia;
    document.getElementById('modal-actividad-hora').textContent = actividad.hora;
    document.getElementById('modal-actividad-ubicacion').textContent = actividad.ubicacion;
    document.getElementById('modal-actividad-profesores').textContent = actividad.profesor;
    document.getElementById('modal-actividad-estilo').textContent = actividad.estilo;
    document.getElementById('modal-actividad-descripcion').textContent = actividad.descripcion;
    const pProfesor = document.getElementById('p-actividad-profesores');
    const pBanda = document.getElementById('p-actividad-banda');
    const pDescripcion = document.getElementById('p-actividad-descripcion');

    if(actividad.profesor) {
        document.getElementById('modal-actividad-profesores').textContent = actividad.profesor;
        pProfesor.style.display = 'block';
    } else {
        pProfesor.style.display = 'none';
    }

    if(actividad.banda) {
        document.getElementById('modal-actividad-banda').textContent = actividad.banda;
        pBanda.style.display = 'block';
    } else {
        pBanda.style.display = 'none';
    }

    if(actividad.descripcion) {
        document.getElementById('modal-actividad-descripcion').textContent = actividad.descripcion;
        pDescripcion.style.display = 'block';
    } else {
        pDescripcion.style.display = 'none';
    }

    document.getElementById('modal-actividad').classList.add('visible');
}
