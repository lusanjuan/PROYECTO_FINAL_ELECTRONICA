// Referencias
const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const pantallaFinal = document.getElementById("pantalla-final");

const btnJugar = document.getElementById("btn-jugar");
const btnReintentar = document.getElementById("btn-reintentar");
const btnVolverInicio = document.getElementById("btn-volver-inicio");

const canasta = document.getElementById("canasta");
const frutasContainer = document.getElementById("frutas-container");
const puntajeUI = document.getElementById("puntaje");
const vidasUI = document.getElementById("vidas");

const menuConfig = document.getElementById("menu-config");
const btnConfig = document.getElementById("btn-config");
const btnSonido = document.getElementById("btn-sonido");
const btnIrInicio = document.getElementById("btn-ir-inicio");
const btnReanudar = document.getElementById("btn-Reanudar");
const musicaFondo = document.getElementById("musica-fondo");
const overlayPausa = document.getElementById("overlay-pausa");


let puntaje = 0;
let vidas = 3;
let intervaloFrutas;
let juegoPausado = false;
let sonidoActivo = true;
let velocidadCaida = 6;
let intervaloCreacion = 1600;
let port;
let reader;
let frutasRecolectadas = [];
let frutaActual = null;
let indiceFrutaActual = 0;


function mostrar(pantalla) {
    document.querySelectorAll(".pantalla").forEach(x => x.classList.remove("visible"));
    pantalla.classList.add("visible");
}

function iniciarJuego() {
    puntaje = 0;
    vidas = 3;
    puntajeUI.textContent = "Puntos: 0";
    actualizarVidas();

    frutasContainer.innerHTML = "";
    mostrar(pantallaJuego);
    velocidadCaida = 3;

    if (sonidoActivo) {
        musicaFondo.currentTime = 0;
        musicaFondo.volume = 0.5;
        musicaFondo.play();
    }

    clearInterval(intervaloFrutas);
    intervaloFrutas = setInterval(() => {
        if (!juegoPausado) crearFruta();
    }, 1200);

    setInterval(() => {
        velocidadCaida -= 0.3;
        if (velocidadCaida < 0.6) velocidadCaida = 0.6;
        console.log("Nueva velocidadCaida:", velocidadCaida);
    }, 15000);

    setInterval(actualizarCanasta, 20);
}

btnJugar.onclick = iniciarJuego;

function actualizarVidas() {
    vidasUI.textContent = "❤️".repeat(vidas);
}

function perderVida() {
    vidas--;
    actualizarVidas();
    if (vidas <= 0) finalizarJuego();
}

const frutasPNG = {
    apple: "manzana.png",
    banana: "banana.png",
    strawberry: "frutilla.png",
    orange: "naranja.png",
    grape: "uva.png"
};


function crearFruta() {
    const tipos = ["apple", "banana", "strawberry", "orange", "grape"];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];

    const fruta = document.createElement("img");
    fruta.src = frutasPNG[tipo];
    fruta.classList.add("fruta");

    fruta.style.left = Math.random() * 80 + "vw";
    fruta.style.animation = `caerSuave ${velocidadCaida}s linear forwards`;

    frutasContainer.appendChild(fruta);

    moverFruta(fruta, tipo);
}


function moverFruta(fruta, tipo) {
    let colisiono = false;
    let y = -100;

    const velocidadPx = window.innerHeight / (velocidadCaida * 50);

    const intervalo = setInterval(() => {
        if (juegoPausado) return;

        y += velocidadPx;
        fruta.style.transform = `translateY(${y}px)`;

        const rectFruta = fruta.getBoundingClientRect();
        const rectCanasta = canasta.getBoundingClientRect();

        if (
            rectFruta.bottom >= rectCanasta.top &&
            rectFruta.left < rectCanasta.right &&
            rectFruta.right > rectCanasta.left
        ) {
            colisiono = true;
            fruta.classList.add("entrar-canasta");

            puntaje++;
            puntajeUI.textContent = "Puntos: " + puntaje;

            frutasRecolectadas.push(tipo);

            // AL LLEGAR A 10 → ACTIVAR CLASIFICACIÓN
            if (frutasRecolectadas.length >= 10) {
                iniciarClasificacion();
            }

            clearInterval(intervalo);
            setTimeout(() => fruta.remove(), 350);
            return;
        }

        if (rectFruta.top >= window.innerHeight) {
            if (!colisiono) perderVida();
            fruta.remove();
            clearInterval(intervalo);
        }

    }, 20);
}

function iniciarClasificacion() {
    clearInterval(intervaloFrutas);
    juegoPausado = true;

    canasta.style.display = "none";
    frutasContainer.innerHTML = "";

    document.getElementById("zona-clasificacion").classList.add("visible");

    indiceFrutaActual = 0;
    mostrarFrutaAClasificar();
}

function mostrarFrutaAClasificar() {
    if (indiceFrutaActual >= frutasRecolectadas.length) {
        finalizarJuego(); // o crear pantalla especial
        return;
    }

    frutaActual = frutasRecolectadas[indiceFrutaActual];

    const img = document.getElementById("fruta-a-clasificar");

    img.src = frutasPNG[frutaActual];
    img.style.left = "45vw";  // posición inicial centrada
}

function soltarEnCanasto(num) {
    let frutaImg = document.getElementById("fruta-a-clasificar");
    let zonas = document.querySelectorAll(".canasto-cl");

    frutaImg.style.transition = "0.4s";
    frutaImg.style.top = zonas[num].getBoundingClientRect().top + "px";
    frutaImg.style.left = zonas[num].getBoundingClientRect().left + "px";

    setTimeout(() => {
        indiceFrutaActual++;
        mostrarFrutaAClasificar();
    }, 500);
}

function finalizarJuego() {
    clearInterval(intervaloFrutas);
    mostrar(pantallaFinal);
    document.getElementById("puntaje-final").textContent = "Puntaje final: " + puntaje;
}

btnReintentar.onclick = iniciarJuego;


document.addEventListener("mousemove", (e) => {
    if (juegoPausado) return;
    const anchoCanasta = 250;
    let x = e.clientX - anchoCanasta / 2;
    const limiteDer = window.innerWidth - anchoCanasta;
    if (x < 0) x = 0;
    if (x > limiteDer) x = limiteDer;
    canasta.style.left = x + "px";
});

function centrarCanastaInicial() {
    const anchoCanasta = 500;
    canasta.style.left = (window.innerWidth - anchoCanasta) / 2 + "px";
}
centrarCanastaInicial();
window.addEventListener("resize", centrarCanastaInicial);


btnConfig.onclick = () => {
    menuConfig.style.display = "flex";
    juegoPausado = true;

    overlayPausa.classList.add("activo");
    pantallaJuego.classList.add("pausado");

    if (sonidoActivo) musicaFondo.pause();
};

btnSonido.onclick = () => {
    sonidoActivo = !sonidoActivo;
    btnSonido.textContent = sonidoActivo ? "Silenciar" : "Activar";

    if (sonidoActivo) musicaFondo.play();
    else musicaFondo.pause();
};

btnReanudar.onclick = () => {
    menuConfig.style.display = "none";
    juegoPausado = false;

    overlayPausa.classList.remove("activo");
    pantallaJuego.classList.remove("pausado");

    if (sonidoActivo) musicaFondo.play();
};


btnIrInicio.onclick = () => {
    menuConfig.style.display = "none";
    juegoPausado = true;

    overlayPausa.classList.remove("activo");
    pantallaJuego.classList.remove("pausado");

    musicaFondo.pause();
    musicaFondo.currentTime = 0;

    mostrar(pantallaInicio);
};

btnVolverInicio.onclick = () => {
    juegoPausado = false;

    overlayPausa.classList.remove("activo");
    pantallaJuego.classList.remove("pausado");

    musicaFondo.pause();
    musicaFondo.currentTime = 0;

    mostrar(pantallaInicio);
};

//modificar esto para el guante

function moverFrutaClasificacion() {
    if (!frutaActual) return;

    let fruta = document.getElementById("fruta-a-clasificar");

    let sensibilidad = 2.5;
    let mov = ax * sensibilidad;

    let X = fruta.getBoundingClientRect().left + mov;

    if (X < 100) X = 100;
    if (X > window.innerWidth - 200) X = window.innerWidth - 200;

    fruta.style.left = X + "px";
}

const UMBRAL = 1.7;

function verificarClasificacion() {

    if (!frutaActual) return;

    // Pulgar → Manzana
    if (H_PULGAR < UMBRAL && frutaActual === "apple") {
        soltarEnCanasto(0);
    }

    // Índice → Banana
    if (H_INDICE < UMBRAL && frutaActual === "banana") {
        soltarEnCanasto(1);
    }

    // Medio → Frutilla
    if (H_MEDIO < UMBRAL && frutaActual === "strawberry") {
        soltarEnCanasto(2);
    }

    // Anular → Naranja
    if (H_ANULAR < UMBRAL && frutaActual === "orange") {
        soltarEnCanasto(3);
    }

    // Meñique → Uva
    if (H_MEÑIQUE < UMBRAL && frutaActual === "grape") {
        soltarEnCanasto(4);
    }
}


function loop() {
    // Movimiento de la canasta solo si estamos en el modo normal
    if (!document.getElementById("zona-clasificacion").classList.contains("visible")) {
        actualizarCanasta();
    }

    // Si estamos en modo clasificación, movemos la fruta con el acelerómetro
    else {
        moverFrutaClasificacion();
        verificarClasificacion();  // acá verificamos los dedos SOLO en este modo
    }

    requestAnimationFrame(loop);
}
loop();
