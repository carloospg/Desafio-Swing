// Muestra una notificacion flotante en la esquina inferior derecha de la pantalla.
// Se usa en lugar de alert() o console.log() para avisar al usuario de lo que pasa.
export function mostrarNotificacion(mensaje, tipo = "info") {

    // Buscamos el contenedor donde se apilan las notificaciones.
    // Si todavia no existe en el DOM, lo creamos y lo pegamos al body.
    let contenedor = document.getElementById("notif-contenedor");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "notif-contenedor";
        document.body.appendChild(contenedor);
    }

    const notif = document.createElement("div");
    notif.className   = `notif notif--${tipo}`;
    notif.textContent = mensaje;

    contenedor.appendChild(notif);

    // Este acceso a offsetHeight fuerza al navegador a recalcular el layout (reflow).
    // Sin esto, el navegador agrupa el "appendChild" y el "classList.add" en un solo
    // paso y la animacion CSS de entrada no llega a ejecutarse.
    notif.offsetHeight;
    notif.classList.add("notif--visible"); 

    // A los 3 segundos inicio la animacion de salida
    setTimeout(() => {
        notif.classList.remove("notif--visible");
        notif.addEventListener("transitionend", () => notif.remove());
    }, 3000);
}