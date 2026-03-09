export function renderHeader() {
    const esRegistro = window.location.pathname.includes("registro");

    document.querySelector("header").innerHTML = `
        <div class="header-inner">
            <p class="header-eyebrow">VIII FESTIVAL · CIUDAD REAL · 2026</p>
            <h1><a href="/index.html" class="header-logo">SWING CR</a></h1>
            <nav>
                <ul>
                    <li>
                        <!-- Si NO estamos en registro, resaltamos el enlace de calendario -->
                        <a href="/index.html#programa" class="nav-link ${!esRegistro ? "nav-link--activo" : ""}">
                            CALENDARIO
                        </a>
                    </li>
                    <li>
                        <!-- Si SI estamos en registro, resaltamos ese enlace -->
                        <a href="/registro.html" class="nav-link nav-cta ${esRegistro ? "nav-link--activo" : ""}">
                            + REGISTRAR EVENTO
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    `;
}

export function renderFooter() {
    document.querySelector("footer").innerHTML = `
        <p>VIII Festival de Swing Ciudad Real · 2026</p>
    `;
}