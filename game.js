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
document.getElementById("btn-guante").onclick = conectarGuante;


let puntaje = 0;
let vidas = 3;
let intervaloFrutas;
let juegoPausado = false;
let sonidoActivo = true;
let velocidadCaida = 6;
let intervaloCreacion = 1600;
let port;
let reader;


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

    // Aumento de dificultad
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
    strawberry: "frutilla.png"
};

function crearFruta() {
    const tipos = ["apple", "banana", "strawberry"];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];

    const fruta = document.createElement("img");
    fruta.src = frutasPNG[tipo];
    fruta.classList.add("fruta");

    fruta.style.left = Math.random() * 80 + "vw";
    fruta.style.animation = `caerSuave ${velocidadCaida}s linear forwards`;

    frutasContainer.appendChild(fruta);
    moverFruta(fruta);
}

function moverFruta(fruta) {
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

let ax = 0;

async function conectarGuante() {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    const decoder = new TextDecoderStream();
    port.readable.pipeTo(decoder.writable);
    const input = decoder.readable.getReader();

    while (true) {
        const { value, done } = await input.read();
        if (done) break;
        if (value) procesarMovimiento(value);
    }
}

function procesarMovimiento(data) {
    try {
        const obj = JSON.parse(data);
        ax = obj.ax;  // recibimos inclinación
        console.log("Llega JSON:", data);
    } catch (e) {
        // si JSON llega "cortado", lo ignoramos
    }
}

function actualizarCanasta() {
    if (juegoPausado) return;

    const sensibilidad = 25;  
    const movimiento = ax * sensibilidad;

    const rect = canasta.getBoundingClientRect();
    let nuevaX = rect.left + movimiento;

    if (nuevaX < 0) nuevaX = 0;
    if (nuevaX > window.innerWidth - rect.width)
        nuevaX = window.innerWidth - rect.width;

    canasta.style.left = nuevaX + "px";
}


function loop() {
    actualizarCanasta();
    requestAnimationFrame(loop);
}
loop();

let guanteConectado = false;

async function conectarGuante() {
    try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

        guanteConectado = true;
        alert("¡Guante conectado con éxito!");
        // ...el resto de tu función de conexión
    } catch (e) {
        alert("Error conectando el guante");
    }
}

btnJugar.onclick = () => {
    if (!guanteConectado) {
        alert("Primero conecta el guante 🧤");
        return;
    }
    iniciarJuego();
};
