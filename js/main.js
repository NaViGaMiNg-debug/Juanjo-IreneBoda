const SUPABASE_URL = "https://kxtxensyeyanlyzlavaw.supabase.co";

const SUPABASE_KEY = "sb_publishable_6GZMdoRADrGy1eWAZ1y8Uw_MZysDEcN";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);



async function cargarInvitados() {

    const { data, error } = await supabaseClient
        .from("invitados")
        .select("id, nombre, seleccionado, seleccionado_por, seleccionado_en")
        .order("id");

    if (error) {
        console.error("Error cargando invitados:", error);
        return;
    }

    const opciones =
        document.getElementById("selector-invitados-opciones");

    const texto =
        document.getElementById("selector-invitados-texto");

    opciones.innerHTML = "";

    /* ========================================
       BUSCAR SI YA TENEMOS UN INVITADO CONFIRMADO
       ======================================== */

    const invitadoConfirmadoActual = data.find(invitado =>
        invitado.seleccionado === true &&
        invitado.seleccionado_por === navegadorId
    );

    invitadoConfirmado =
        invitadoConfirmadoActual !== undefined;

    if (invitadoConfirmadoActual) {

        invitadoSeleccionado = invitadoConfirmadoActual;

        texto.textContent =
            invitadoConfirmadoActual.nombre;

        botonConfirmarInvitado.disabled = true;

        estadoConfirmacion.textContent =
            "✓ Asistencia confirmada";
    }

    /* ========================================
    CREAR OPCIONES
    ======================================== */

    data.forEach(invitado => {

        const elemento =
            document.createElement("button");

        elemento.type = "button";

        elemento.className =
            "opcion-invitado";

        elemento.textContent =
            invitado.nombre;


        /* ========================================
        INVITADO CONFIRMADO POR ESTE NAVEGADOR
        ======================================== */

        if (
            invitado.seleccionado === true &&
            invitado.seleccionado_por === navegadorId
        ) {

            elemento.classList.add("seleccionado");
            elemento.classList.add("confirmado");

            elemento.disabled = true;

            invitadoSeleccionado = invitado;

            texto.textContent =
                invitado.nombre;

            botonConfirmarInvitado.disabled =
                true;

            estadoConfirmacion.textContent =
                "✓ Asistencia confirmada";

        }


        /* ========================================
        INVITADO CONFIRMADO POR OTRA PERSONA
        ======================================== */

        else if (invitado.seleccionado === true) {

            elemento.classList.add("confirmado");

            elemento.disabled = true;

        }


        /* ========================================
        INVITADO SELECCIONADO POR ESTE NAVEGADOR
        ======================================== */

        else if (
            invitado.seleccionado_por === navegadorId
        ) {

            elemento.classList.add("seleccionado");

            invitadoSeleccionado =
                invitado;

            texto.textContent =
                invitado.nombre;

            botonConfirmarInvitado.disabled =
                false;

            estadoConfirmacion.textContent =
                "";

        }


        /* ========================================
        INVITADO OCUPADO POR OTRA PERSONA
        ======================================== */

        else if (
            invitado.seleccionado_por !== null
        ) {

            elemento.classList.add("ocupado");

            elemento.disabled = true;

        }


        /* ========================================
        CLICK
        ======================================== */

        if (!elemento.disabled) {

            elemento.addEventListener("click", async () => {

                if (invitadoConfirmado) {
                    return;
                }

                await seleccionarInvitado(
                    invitado,
                    elemento
                );

                await cargarInvitados();

            });

        }


        opciones.appendChild(elemento);

    });
}


/* ========================================
   SELECTOR DE INVITADOS
   ======================================== */

const selectorBoton =
    document.getElementById("selector-invitados-boton");

const selectorOpciones =
    document.getElementById("selector-invitados-opciones");


selectorBoton.addEventListener("click", () => {

    const abierto =
        selectorOpciones.classList.toggle("abierto");

    selectorBoton.classList.toggle(
        "abierto",
        abierto
    );

});


const botonConfirmarInvitado =
    document.getElementById("boton-confirmar-invitado");

const estadoConfirmacion =
    document.getElementById("estado-confirmacion");


/* Cerrar al pulsar fuera */

document.addEventListener("click", evento => {

    if (
        !evento.target.closest(".selector-invitados")
    ) {

        selectorOpciones.classList.remove("abierto");

        selectorBoton.classList.remove("abierto");

    }

});


/* ========================================
   IDENTIFICADOR DEL NAVEGADOR
   ======================================== */

let invitadoSeleccionado = null;
let invitadoConfirmado = false;

let navegadorId = localStorage.getItem("navegador_id");

if (!navegadorId) {

    navegadorId = crypto.randomUUID();

    localStorage.setItem(
        "navegador_id",
        navegadorId
    );

}

cargarInvitados();

/* ========================================
   SELECCIÓN DE INVITADO
   ======================================== */

async function seleccionarInvitado(invitado, elemento) {

    if (invitadoConfirmado) {
        return;
    }

    /* Si ya es nuestro, lo liberamos */

    if (invitado.seleccionado_por === navegadorId) {

        const { data, error } = await supabaseClient
            .rpc("liberar_invitado", {
                invitado_id: invitado.id,
                navegador_id: navegadorId
            });

        if (error) {
            console.error("Error al liberar invitado:", error);
            return;
        }

        if (data === true) {

            invitado.seleccionado_por = null;
            invitado.seleccionado_en = null;

            elemento.classList.remove("seleccionado");
        }

        return;
    }


    /* Si pertenece a otra persona, no hacemos nada */

    if (
        invitado.seleccionado_por !== null &&
        invitado.seleccionado_por !== navegadorId
    ) {

        return;
    }


    /* Intentamos reservarlo */

    const { data, error } = await supabaseClient
        .rpc("cambiar_invitado", {
            nuevo_invitado_id: invitado.id,
            navegador_id: navegadorId
        });

    if (error) {
        console.error("Error al reservar invitado:", error);
        return;
    }


    /* Supabase nos dice si lo hemos conseguido */

    if (data === true) {

        /* Primero quitamos nuestra selección anterior */

        document
            .querySelectorAll(".invitado.seleccionado")
            .forEach(elementoAnterior => {

                elementoAnterior.classList.remove("seleccionado");

            });


        /* Marcamos el nuevo */

        elemento.classList.add("seleccionado");


        /* Actualizamos los datos locales */

        invitado.seleccionado_por = navegadorId;
        invitado.seleccionado_en = new Date().toISOString();

    } else {

        /* Alguien lo ha reservado antes que nosotros */

        elemento.classList.remove("seleccionado");

        alert("Este nombre ya ha sido seleccionado por otra persona.");
    }
}

botonConfirmarInvitado.addEventListener("click", async () => {

    if (!invitadoSeleccionado) {
        return;
    }

    if (invitadoSeleccionado.seleccionado) {
        return;
    }

    const confirmar = confirm(
        `¿Estás seguro de que quieres confirmar a ${invitadoSeleccionado.nombre}?`
    );

    if (!confirmar) {
        return;
    }

    botonConfirmarInvitado.disabled = true;

    const { data, error } =
        await supabaseClient.rpc(
            "confirmar_invitado",
            {
                invitado_id: invitadoSeleccionado.id,
                navegador_id: navegadorId
            }
        );

    if (error) {

        console.error(
            "Error confirmando invitado:",
            error
        );

        botonConfirmarInvitado.disabled = false;

        alert(
            "No se ha podido confirmar la asistencia."
        );

        return;
    }

    if (data === true) {

        invitadoSeleccionado.seleccionado = true;

        invitadoConfirmado = true;

        estadoConfirmacion.textContent =
            "✓ Asistencia confirmada";

        await cargarInvitados();

    } else {

        botonConfirmarInvitado.disabled = false;

        alert(
            "No se ha podido confirmar este nombre."
        );
    }

});

/* ========================================
   CUENTA ATRÁS
   ======================================== */

const fechaEvento = new Date("2027-04-30T19:30:00");

function actualizarCuentaAtras() {

    const ahora = new Date();

    const diferencia = fechaEvento - ahora;

    const texto = document.getElementById("texto-cuenta-atras");


    /* ========================================
        DESPUÉS DEL EVENTO
        ======================================== */

        const diaSiguienteAlEvento = new Date("2027-05-01T00:00:00");

            if (ahora >= diaSiguienteAlEvento) {

                document.getElementById("dias").textContent = "00";
                document.getElementById("horas").textContent = "00";
                document.getElementById("minutos").textContent = "00";
                document.getElementById("segundos").textContent = "00";

                texto.textContent =
                    "¿Reviviendo recuerdos?";

                return;
            }


    /* ========================================
       CÁLCULO DEL TIEMPO
       ======================================== */

        const dias = Math.floor(
            diferencia / (1000 * 60 * 60 * 24)
        );

        const horas = Math.floor(
            (diferencia / (1000 * 60 * 60)) % 24
        );

        const minutos = Math.floor(
            (diferencia / (1000 * 60)) % 60
        );

        const segundos = Math.floor(
            (diferencia / 1000) % 60
        );


    /* ========================================
       MOSTRAR EL TIEMPO
       ======================================== */

        document.getElementById("dias").textContent =
            String(dias).padStart(2, "0");

        document.getElementById("horas").textContent =
            String(horas).padStart(2, "0");

        document.getElementById("minutos").textContent =
            String(minutos).padStart(2, "0");

        document.getElementById("segundos").textContent =
            String(segundos).padStart(2, "0");


    /* ========================================
       TEXTO DEL DÍA DEL EVENTO
       ======================================== */

        if (dias === 0) {

            texto.textContent =
                "¿Qué haces mirando la web? ¡Mira la boda!";

            return;
        }


    /* ========================================
       TEXTOS DE LA CUENTA ATRÁS
       ======================================== */

    if (dias === 1) {

        texto.textContent =
            "Mañana es el gran día.";

    } else if (dias === 2) {

        texto.textContent =
            "Solo quedan 2 días.";

    } else if (dias === 3) {

        texto.textContent =
            "3 días para los 10 años.";

    } else if (dias === 4) {

        texto.textContent =
            "4 días. Ya queda muy poquito.";

    } else if (dias === 5) {

        texto.textContent =
            "5 días para volver a celebrar su historia.";

    } else if (dias === 6) {

        texto.textContent =
            "6 días. La cuenta atrás ya va en serio.";

    } else if (dias === 7) {

        texto.textContent =
            "Una semana para volver a decir \"sí, quiero\".";

    } else if (dias === 8) {

        texto.textContent =
            "8 días. Ya huele a celebración.";

    } else if (dias === 9) {

        texto.textContent =
            "9 días para volver a celebrar 10 años juntos.";

    } else if (dias === 10) {

        texto.textContent =
            "Diez días para los 10 años.";

    } else if (dias === 11) {

        texto.textContent =
            "11 días. Ya casi podemos contarlos con las manos.";

    } else if (dias === 12) {

        texto.textContent =
            "12 días para volver a decir \"sí, quiero\".";

    } else if (dias === 13) {

        texto.textContent =
            "Ya solo quedan 13 días...";

    } else if (dias === 14) {

        texto.textContent =
            "Dos semanas para volver a celebrar su historia.";

    } else if (dias <= 30) {

        texto.textContent =
            `${dias} días para volver a celebrar una historia de 10 años.`;

    } else if (dias <= 60) {

        texto.textContent =
            "Ya empieza la cuenta atrás para sus 10 años.";

    } else if (dias <= 100) {

        texto.textContent =
            "Cada vez queda menos para volver a celebrar su historia.";

    } else if (dias <= 200) {

        texto.textContent =
            "El gran día empieza a acercarse...";

    } else {

        texto.textContent =
            "Una historia que merece volver a celebrarse.";
    }
}


/* ========================================
   INICIAR CUENTA ATRÁS
   ======================================== */

actualizarCuentaAtras();

setInterval(actualizarCuentaAtras, 1000);

/* ========================================
   ACTUALIZACIÓN EN TIEMPO REAL
   ======================================== */

supabaseClient
    .channel("cambios-invitados")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "invitados"
        },
        () => {
            cargarInvitados();
        }
    )
    .subscribe();

    /* ========================================
   RECUERDOS / GALERÍA DE FOTOS
   ======================================== */

const botonVerFotos =
    document.getElementById("boton-ver-fotos");

const galeriaFotos =
    document.getElementById("galeria-fotos");

const visorFotos =
    document.getElementById("visor-fotos");

const visorImagen =
    document.getElementById("visor-imagen");

const visorAutor =
    document.getElementById("visor-autor");

const visorCerrar =
    document.getElementById("visor-cerrar");

const visorAnterior =
    document.getElementById("visor-anterior");

const visorSiguiente =
    document.getElementById("visor-siguiente");

let fotosCargadas = [];

let fotoActual = 0;

/* ========================================
   CARGAR FOTOS
   ======================================== */

async function cargarFotos() {

    const { data, error } = await supabaseClient
        .from("fotos")
        .select("id, nombre_archivo, url, subido_por, subido_en")
        .order("subido_en", { ascending: false });

    if (error) {

        console.error(
            "Error cargando fotos:",
            error
        );

        return;
    }


    /* Guardamos las fotos para poder navegar por ellas */

    fotosCargadas = data;


    galeriaFotos.innerHTML = "";


    data.forEach((foto, indice) => {

        const imagen =
            document.createElement("img");

        imagen.src = foto.url;

        imagen.alt =
            "Foto compartida por " +
            (foto.subido_por || "un invitado");

        imagen.loading = "lazy";


        /* ========================================
           ABRIR VISOR
           ======================================== */

        imagen.addEventListener("click", () => {

            abrirVisor(indice);

        });


        galeriaFotos.appendChild(imagen);

    });
}


/* ========================================
   ABRIR / CERRAR GALERÍA
   ======================================== */

botonVerFotos.addEventListener("click", async () => {

    const abierta =
        galeriaFotos.classList.toggle("abierta");


    if (abierta) {

        await cargarFotos();

        botonVerFotos.innerHTML =
            'Ocultar fotos <span>⌃</span>';

    } else {

        botonVerFotos.innerHTML =
            'Ver fotos <span>⌄</span>';

    }

});


/* ========================================
   CARGA INICIAL
   ======================================== */

cargarFotos();

/* ========================================
   SUBIR FOTOS
   ======================================== */

const botonSubirFoto =
    document.getElementById("boton-subir-foto");

const inputFoto =
    document.getElementById("input-foto");


/* Abrir selector de archivos */

botonSubirFoto.addEventListener("click", () => {

    inputFoto.click();

});


/* ========================================
   PROCESAR FOTO SELECCIONADA
   ======================================== */

inputFoto.addEventListener("change", async () => {

    const archivos = Array.from(inputFoto.files);

    if (!archivos.length) {
        return;
    }


    /* ========================================
       BUSCAR EL INVITADO
       ======================================== */

    const { data: invitado, error: errorInvitado } =
        await supabaseClient
            .from("invitados")
            .select("id, nombre")
            .eq("seleccionado_por", navegadorId)
            .maybeSingle();


    if (errorInvitado) {

        console.error(
            "Error buscando el invitado:",
            errorInvitado
        );

        alert("No se ha podido comprobar tu invitado.");

        inputFoto.value = "";

        return;
    }


    /* ========================================
       COMPROBAR QUE HAYA SELECCIONADO UN NOMBRE
       ======================================== */

    if (!invitado) {

        alert(
            "Primero selecciona tu nombre antes de subir fotos."
        );

        inputFoto.value = "";

        return;
    }


    /* ========================================
       COMPROBAR TODAS LAS FOTOS
       ======================================== */

    const limite =
        10 * 1024 * 1024;

    for (const archivo of archivos) {

        if (!archivo.type.startsWith("image/")) {

            alert(
                `"${archivo.name}" no es una imagen.`
            );

            inputFoto.value = "";

            return;
        }


        if (archivo.size > limite) {

            alert(
                `"${archivo.name}" supera el límite de 10 MB.`
            );

            inputFoto.value = "";

            return;
        }

    }


    /* ========================================
       SUBIR LAS FOTOS
       ======================================== */

    let fotosSubidas = 0;


    for (const archivo of archivos) {

        const extension =
            archivo.name.includes(".")
                ? archivo.name.substring(
                    archivo.name.lastIndexOf(".")
                )
                : "";


        const nombreArchivo =
            `${crypto.randomUUID()}${extension}`;


        /* ========================================
           STORAGE
           ======================================== */

        const { error: errorSubida } =
            await supabaseClient
                .storage
                .from("fotos")
                .upload(
                    nombreArchivo,
                    archivo,
                    {
                        cacheControl: "3600",
                        upsert: false
                    }
                );


        if (errorSubida) {

            console.error(
                "Error subiendo la foto:",
                errorSubida
            );

            alert(
                `No se ha podido subir "${archivo.name}".`
            );

            continue;
        }


        /* ========================================
           URL PÚBLICA
           ======================================== */

        const { data: urlData } =
            supabaseClient
                .storage
                .from("fotos")
                .getPublicUrl(
                    nombreArchivo
                );


        const url =
            urlData.publicUrl;


        /* ========================================
           GUARDAR EN LA TABLA
           ======================================== */

        const { error: errorRegistro } =
            await supabaseClient
                .from("fotos")
                .insert({
                    nombre_archivo: nombreArchivo,
                    url: url,
                    subido_por: invitado.nombre
                });


        /* ========================================
           SI FALLA EL REGISTRO
           ======================================== */

        if (errorRegistro) {

            console.error(
                "Error guardando la información:",
                errorRegistro
            );


            await supabaseClient
                .storage
                .from("fotos")
                .remove([
                    nombreArchivo
                ]);


            console.error(
                `No se pudo registrar "${archivo.name}".`
            );

            continue;
        }


        fotosSubidas++;

    }


    /* ========================================
       RESULTADO
       ======================================== */

    if (fotosSubidas === archivos.length) {

        alert(
            fotosSubidas === 1
                ? "¡Foto subida correctamente! ❤️"
                : `¡${fotosSubidas} fotos subidas correctamente! ❤️`
        );

    } else if (fotosSubidas > 0) {

        alert(
            `Se han subido ${fotosSubidas} de ${archivos.length} fotos.`
        );

    } else {

        alert(
            "No se ha podido subir ninguna foto."
        );

    }


    inputFoto.value = "";


    /* ========================================
       RECARGAR GALERÍA
       ======================================== */

    await cargarFotos();

});

    /* ========================================
   ABRIR VISOR
   ======================================== */

function abrirVisor(indice) {

    if (!fotosCargadas.length) {
        return;
    }

    fotoActual = indice;

    mostrarFotoActual();

    visorFotos.classList.add("abierto");

    visorFotos.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* ========================================
   MOSTRAR FOTO ACTUAL
   ======================================== */

function mostrarFotoActual() {

    const foto =
        fotosCargadas[fotoActual];

    if (!foto) {
        return;
    }


    visorImagen.src = foto.url;

    visorImagen.alt =
        "Foto compartida por " +
        (foto.subido_por || "un invitado");


    if (foto.subido_por) {

        visorAutor.textContent =
            "Compartida por " + foto.subido_por;

    } else {

        visorAutor.textContent = "";

    }

}


/* ========================================
   FOTO ANTERIOR
   ======================================== */

function mostrarFotoAnterior() {

    if (!fotosCargadas.length) {
        return;
    }

    fotoActual--;

    if (fotoActual < 0) {

        fotoActual =
            fotosCargadas.length - 1;

    }

    mostrarFotoActual();

}


/* ========================================
   FOTO SIGUIENTE
   ======================================== */

function mostrarFotoSiguiente() {

    if (!fotosCargadas.length) {
        return;
    }

    fotoActual++;

    if (
        fotoActual >=
        fotosCargadas.length
    ) {

        fotoActual = 0;

    }

    mostrarFotoActual();

}


/* ========================================
   CERRAR VISOR
   ======================================== */

function cerrarVisor() {

    visorFotos.classList.remove("abierto");

    visorFotos.setAttribute(
        "aria-hidden",
        "true"
    );

    visorImagen.src = "";

}


/* ========================================
   BOTONES
   ======================================== */

visorCerrar.addEventListener(
    "click",
    cerrarVisor
);


visorAnterior.addEventListener(
    "click",
    mostrarFotoAnterior
);


visorSiguiente.addEventListener(
    "click",
    mostrarFotoSiguiente
);

/* ========================================
   DESLIZAR EN MÓVIL
   ======================================== */

let inicioToqueX = 0;
let inicioToqueY = 0;

visorFotos.addEventListener("touchstart", evento => {

    if (!visorFotos.classList.contains("abierto")) {
        return;
    }

    inicioToqueX = evento.changedTouches[0].screenX;
    inicioToqueY = evento.changedTouches[0].screenY;

}, { passive: true });


visorFotos.addEventListener("touchend", evento => {

    if (!visorFotos.classList.contains("abierto")) {
        return;
    }

    const finalToqueX =
        evento.changedTouches[0].screenX;

    const finalToqueY =
        evento.changedTouches[0].screenY;


    const diferenciaX =
        finalToqueX - inicioToqueX;

    const diferenciaY =
        finalToqueY - inicioToqueY;


    /* Evitamos que un movimiento vertical
       se interprete como un cambio de foto */

    if (
        Math.abs(diferenciaX) <
        Math.abs(diferenciaY)
    ) {
        return;
    }


    /* Necesitamos al menos 50px de desplazamiento */

    if (Math.abs(diferenciaX) < 50) {
        return;
    }


    /* Deslizar hacia la izquierda → siguiente */

    if (diferenciaX < 0) {

        mostrarFotoSiguiente();

    }


    /* Deslizar hacia la derecha → anterior */

    else {

        mostrarFotoAnterior();

    }

}, { passive: true });

/* ========================================
   RECOMENDACIONES
   ======================================== */

const inputCancion =
    document.getElementById("input-cancion");

const botonEnviarCancion =
    document.getElementById("boton-enviar-cancion");

const inputGeneral =
    document.getElementById("input-general");

const botonEnviarGeneral =
    document.getElementById("boton-enviar-general");


/* ========================================
   ENVIAR RECOMENDACIÓN
   ======================================== */

async function enviarRecomendacion(tipo, input, boton) {

    const texto = input.value.trim();

    /* No permitir enviar vacío */

    if (!texto) {

        alert("Escribe una recomendación antes de enviarla.");

        input.focus();

        return;
    }


    /* ========================================
       BUSCAR AL INVITADO
       ======================================== */

    const { data: invitado, error: errorInvitado } =
        await supabaseClient
            .from("invitados")
            .select("id, nombre")
            .eq("seleccionado_por", navegadorId)
            .maybeSingle();


    if (errorInvitado) {

        console.error(
            "Error buscando el invitado:",
            errorInvitado
        );

        alert(
            "No se ha podido comprobar quién eres."
        );

        return;
    }


    /* ========================================
       COMPROBAR QUE HAYA SELECCIONADO NOMBRE
       ======================================== */

    if (!invitado) {

        alert(
            "Primero selecciona tu nombre antes de enviar una recomendación."
        );

        return;
    }


    /* ========================================
       GUARDAR EN SUPABASE
       ======================================== */

    boton.disabled = true;

    boton.textContent = "Enviando...";


    const { error } =
        await supabaseClient
            .from("recomendaciones")
            .insert({
                tipo: tipo,
                texto: texto,
                enviado_por: invitado.nombre
            });


    /* ========================================
       ERROR
       ======================================== */

    if (error) {

        console.error(
            "Error guardando recomendación:",
            error
        );

        alert(
            "No se ha podido enviar la recomendación."
        );

        boton.disabled = false;

        boton.textContent = "Enviar";

        return;
    }


    /* ========================================
       TODO CORRECTO
       ======================================== */

    input.value = "";

    boton.disabled = false;

    boton.textContent = "Enviar";


    alert(
        "¡Recomendación enviada! ❤️"
    );
}


/* ========================================
   BOTÓN — CANCIONES
   ======================================== */

botonEnviarCancion.addEventListener(
    "click",
    () => {

        enviarRecomendacion(
            "cancion",
            inputCancion,
            botonEnviarCancion
        );

    }
);


/* ========================================
   BOTÓN — RECOMENDACIONES GENERALES
   ======================================== */

botonEnviarGeneral.addEventListener(
    "click",
    () => {

        enviarRecomendacion(
            "general",
            inputGeneral,
            botonEnviarGeneral
        );

    }
);

/* ========================================
   MENÚ LATERAL
   ======================================== */

const botonMenu =
    document.getElementById("boton-menu");

const menuLateral =
    document.getElementById("menu-lateral");

const menuFondo =
    document.getElementById("menu-fondo");


/* ========================================
   ABRIR / CERRAR MENÚ
   ======================================== */

function abrirMenu() {

    menuLateral.classList.add("abierto");
    menuFondo.classList.add("abierto");

    botonMenu.classList.add("abierto");

    botonMenu.setAttribute(
        "aria-expanded",
        "true"
    );

    menuLateral.setAttribute(
        "aria-hidden",
        "false"
    );

}


function cerrarMenu() {

    menuLateral.classList.remove("abierto");
    menuFondo.classList.remove("abierto");

    botonMenu.classList.remove("abierto");

    botonMenu.setAttribute(
        "aria-expanded",
        "false"
    );

    menuLateral.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* ========================================
   BOTÓN
   ======================================== */

botonMenu.addEventListener(
    "click",
    () => {

        if (
            menuLateral.classList.contains("abierto")
        ) {

            cerrarMenu();

        } else {

            abrirMenu();

        }

    }
);


/* ========================================
   CERRAR AL PULSAR EL FONDO
   ======================================== */

menuFondo.addEventListener(
    "click",
    cerrarMenu
);

/* ========================================
   NAVEGACIÓN DEL MENÚ
   ======================================== */

const opcionesMenu =
    document.querySelectorAll(
        ".menu-navegacion button"
    );

const vistas =
    document.querySelectorAll(".vista");


opcionesMenu.forEach(opcion => {

    opcion.addEventListener("click", () => {

        const nombreVista =
            opcion.dataset.vista;

        const vistaObjetivo =
            document.getElementById(
                `vista-${nombreVista}`
            );

        if (!vistaObjetivo) {

            console.error(
                "No se encontró la vista:",
                nombreVista
            );

            return;
        }


        /* ========================================
           OCULTAR TODAS LAS VISTAS
           ======================================== */

        vistas.forEach(vista => {

            vista.classList.remove("activa");

        });


        /* ========================================
           MOSTRAR LA VISTA ELEGIDA
           ======================================== */

        vistaObjetivo.classList.add("activa");


        /* ========================================
           CERRAR EL MENÚ
           ======================================== */

        cerrarMenu();

        /* Volver arriba */

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

});

/* ========================================
   ENLACE — RECOMENDACIONES
   ======================================== */

const enlaceRecomendaciones =
    document.querySelector(
        ".enlace-recomendaciones"
    );


if (enlaceRecomendaciones) {

    enlaceRecomendaciones.addEventListener(
        "click",
        evento => {

            evento.preventDefault();


            /* Ocultar todas las vistas */

            vistas.forEach(vista => {

                vista.classList.remove("activa");

            });


            /* Mostrar recomendaciones */

            const vistaRecomendaciones =
                document.getElementById(
                    "vista-recomendaciones"
                );


            if (!vistaRecomendaciones) {

                console.error(
                    "No se encontró la vista de recomendaciones"
                );

                return;

            }


            vistaRecomendaciones.classList.add(
                "activa"
            );


            /* Volver arriba */

            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );

}

/* ========================================
   REPRODUCTOR DE MÚSICA
   ======================================== */

const reproductorMusica =
    document.getElementById("reproductor-musica");

const botonMusica =
    document.getElementById("boton-musica");


/* ========================================
   LISTA DE CANCIONES
   ======================================== */

const canciones = [
    {
        archivo: "assets/songs/song1.mp3",
        inicio: 18,
        fin: 83
    },
    {
        archivo: "assets/songs/song2.mp3",
        inicio: 37,
        fin: 100
    },
    {
        archivo: "assets/songs/song3.mp3",
        inicio: 147,
        fin: 214
    },
    {
        archivo: "assets/songs/song4.mp3",
        duracion: 65
    },
    {
        archivo: "assets/songs/song5.mp3",
        inicio: 7,
        fin: 82
    },
    {
        archivo: "assets/songs/song6.mp3",
        inicio: 135,
        fin: 201
    }
];

let cancionActual = 0;
let intervaloCancion = null;
let haciendoTransicion = false;

let ordenCanciones = [];
let posicionOrden = 0;


/* ========================================
   DURACIÓN DEL FUNDIDO
   ======================================== */

const duracionFundido = 4000;

/* ========================================
   CREAR ORDEN ALEATORIO
   ======================================== */

function crearOrdenAleatorio() {

    ordenCanciones = [
        0,
        1,
        2,
        3,
        4,
        5
    ];

    /* Fisher-Yates */

    for (
        let i = ordenCanciones.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            ordenCanciones[i],
            ordenCanciones[j]
        ] = [
            ordenCanciones[j],
            ordenCanciones[i]
        ];

    }


    /* Evitar que el primer tema
       sea el mismo que el último
       de la ronda anterior */

    if (
        ordenCanciones.length > 1 &&
        ordenCanciones[0] === cancionActual
    ) {

        [
            ordenCanciones[0],
            ordenCanciones[1]
        ] = [
            ordenCanciones[1],
            ordenCanciones[0]
        ];

    }

    posicionOrden = 0;

}


/* Crear el primer orden */

crearOrdenAleatorio();

/* ========================================
   CARGAR CANCIÓN
   ======================================== */

function cargarCancion(indice) {

    cancionActual = indice;

    const cancion =
        canciones[cancionActual];

    reproductorMusica.src =
        cancion.archivo;

    reproductorMusica.load();

}


/* ========================================
   PREPARAR INTERVALO
   ======================================== */

function prepararIntervaloCancion(cancion) {

    /* Las canciones con intervalo fijo
       ya tienen inicio y fin */

    if (cancion.inicio !== undefined) {
        return;
    }


    /* SONG 4 — INTERVALO ALEATORIO */

    const duracionIntervalo =
        cancion.duracion;

    const maximoInicio =
        reproductorMusica.duration -
        duracionIntervalo;


    if (maximoInicio <= 0) {

        cancion.inicio = 0;

        cancion.fin =
            reproductorMusica.duration;

        return;
    }


    const inicioAleatorio =
        Math.random() * maximoInicio;

    cancion.inicio =
        inicioAleatorio;

    cancion.fin =
        inicioAleatorio +
        duracionIntervalo;

}


/* ========================================
   INICIAR INTERVALO
   ======================================== */

function iniciarIntervaloCancion() {

    clearInterval(intervaloCancion);

    const cancion =
        canciones[cancionActual];

    prepararIntervaloCancion(cancion);

    reproductorMusica.currentTime =
        cancion.inicio;


    intervaloCancion = setInterval(() => {

        if (
            reproductorMusica.currentTime >=
            cancion.fin
        ) {

            clearInterval(intervaloCancion);

            cambiarCancionConFundido();

        }

    }, 100);

}


/* ========================================
   FUNDIDO DE SALIDA
   ======================================== */

function fundidoSalida() {

    return new Promise(resolve => {

        const pasos = 20;

        let paso = 0;

        const volumenInicial =
            reproductorMusica.volume;

        const intervalo =
            duracionFundido / pasos;


        const fade =
            setInterval(() => {

                paso++;

                reproductorMusica.volume =
                    volumenInicial *
                    (1 - paso / pasos);


                if (paso >= pasos) {

                    clearInterval(fade);

                    reproductorMusica.volume = 0;

                    resolve();

                }

            }, intervalo);

    });

}


/* ========================================
   FUNDIDO DE ENTRADA
   ======================================== */

function fundidoEntrada() {

    return new Promise(resolve => {

        const pasos = 20;

        let paso = 0;

        const intervalo =
            duracionFundido / pasos;


        const fade =
            setInterval(() => {

                paso++;

                reproductorMusica.volume =
                    paso / pasos;


                if (paso >= pasos) {

                    clearInterval(fade);

                    reproductorMusica.volume = 1;

                    resolve();

                }

            }, intervalo);

    });

}


/* ========================================
   CAMBIAR CANCIÓN CON FUNDIDO
   ======================================== */

async function cambiarCancionConFundido() {

    if (haciendoTransicion) {
        return;
    }

    haciendoTransicion = true;


    /* FUNDIDO DE SALIDA */

    await fundidoSalida();


    /* SIGUIENTE CANCIÓN */

    posicionOrden++;

if (
    posicionOrden >=
    ordenCanciones.length
) {

    crearOrdenAleatorio();

}

cancionActual =
    ordenCanciones[posicionOrden];

    cargarCancion(cancionActual);


    /* Esperamos a que cargue */

    reproductorMusica.addEventListener(
        "loadedmetadata",
        async function prepararNuevaCancion() {

            reproductorMusica.removeEventListener(
                "loadedmetadata",
                prepararNuevaCancion
            );


            iniciarIntervaloCancion();


            if (!reproductorMusica.muted) {

                await reproductorMusica.play();

                await fundidoEntrada();

            }


            haciendoTransicion = false;

        }
    );

}


/* ========================================
   INICIAR PRIMERA CANCIÓN
   ======================================== */

cargarCancion(
    ordenCanciones[0]
);

cancionActual =
    ordenCanciones[0];

reproductorMusica.addEventListener(
    "loadedmetadata",
    () => {

        iniciarIntervaloCancion();

    }
);


/* ========================================
   ESTADO INICIAL
   ======================================== */

reproductorMusica.volume = 1;

reproductorMusica.muted = true;


/* ========================================
   BOTÓN DE MÚSICA
   ======================================== */

botonMusica.addEventListener(
    "click",
    () => {

        if (reproductorMusica.muted) {

            reproductorMusica.muted = false;

            reproductorMusica.volume = 0;

            reproductorMusica.play();

            fundidoEntrada();


            botonMusica.setAttribute(
                "aria-label",
                "Silenciar música"
            );

            botonMusica.setAttribute(
                "aria-pressed",
                "true"
            );


            botonMusica
                .querySelector(
                    ".onda-sonido"
                )
                .style.display = "block";


        } else {

            reproductorMusica.muted = true;

            botonMusica.setAttribute(
                "aria-label",
                "Activar música"
            );

            botonMusica.setAttribute(
                "aria-pressed",
                "false"
            );


            botonMusica
                .querySelector(
                    ".onda-sonido"
                )
                .style.display = "none";

        }

    }
);

/* ========================================
   DESPLEGABLES — MENÚ
   ======================================== */

const botonesMenu =
    document.querySelectorAll(
        "#vista-menu .menu-desplegable"
    );


botonesMenu.forEach(boton => {

    boton.addEventListener("click", () => {

        const contenido =
            boton.nextElementSibling;


        /* ========================================
           CERRAR SI YA ESTÁ ABIERTO
           ======================================== */

        if (boton.classList.contains("abierto")) {

            boton.classList.remove("abierto");

            contenido.classList.remove("abierto");

            return;

        }


        /* ========================================
           ABRIR
           ======================================== */

        boton.classList.add("abierto");

        contenido.classList.add("abierto");

    });

});

/* ========================================
   NUESTRA HISTORIA — CARRUSEL
   ======================================== */

const historiaFoto =
    document.getElementById("historia-foto");

const historiaPista =
    document.getElementById("historia-pista");

const historiaFrase =
    document.getElementById("historia-frase");

const historiaContador =
    document.getElementById("historia-contador");

const historiaAnterior =
    document.querySelector(".historia-anterior");

const historiaSiguiente =
    document.querySelector(".historia-siguiente");


/* ========================================
   FOTOS Y FRASES
   ======================================== */

const historiaFrases = [

    "El novio",
    "La novia",
    "Primera foto juntos",
    "Noviazgo",
    "Construyendo",
    "Esperando",
    "Familia",
    "Poco a poco",
    "Un hogar",
    "Ilusiones",
    "Siempre de la mano",
    "Siempre...",
    "Siempre...",
    "Siempre.",
    "Y a disfrutar de la vida",
    "Con viajes",
    "Asturias",
    "Córdoba",
    "Almería",
    "Granada",
    "Madrid",
    "Sevilla",
    "Málaga",
    "Inglaterra",
    "En casa",
    "En la calle",
    "En las motos",
    "De concierto",
    "En la playa",
    "De feria",
    "En la sierra",
    "En el falla",
    "De halloween",
    "Carnavaleando",
    "Navideños",
    "De cumple",
    "De ruta",
    "En equipo",
    "Íntimo",
    "Con cariño",
    "Celebrando",
    "Brindando",
    "Orgullosos",
    "Muuuy orgullosos",
    "Payasos",
    "Muy nosotros",
    "Cumpliendo metas",
    "Nosotros"

];


const historiaFotos =
    historiaFrases.map(
        (_, indice) =>
            `assets/shots/shot${indice + 1}.jpeg`
    );


/* ========================================
   ESTADO
   ======================================== */

let historiaActual = 0;

let historiaTemporizador = null;

let historiaAnimando = false;


/* ========================================
   ACTUALIZAR LAS TRES FOTOS
   ======================================== */

function actualizarTresFotos() {

    const anterior =
        (historiaActual - 1 + historiaFotos.length)
        % historiaFotos.length;

    const siguiente =
        (historiaActual + 1)
        % historiaFotos.length;


    const imagenes =
        historiaPista.querySelectorAll(
            ".historia-imagen"
        );


    imagenes[0].src =
        historiaFotos[anterior];

    imagenes[0].alt =
        historiaFrases[anterior];


    imagenes[1].src =
        historiaFotos[historiaActual];

    imagenes[1].alt =
        historiaFrases[historiaActual];


    imagenes[2].src =
        historiaFotos[siguiente];

    imagenes[2].alt =
        historiaFrases[siguiente];


    historiaFrase.textContent =
        historiaFrases[historiaActual];

    historiaContador.textContent =
        `${historiaActual + 1} / ${historiaFotos.length}`;

}


/* ========================================
   DISTANCIA ENTRE DOS MARCOS
   ======================================== */

function obtenerAnchoHistoria() {

    const slides =
        historiaPista.querySelectorAll(
            ".historia-slide"
        );

    if (slides.length < 2) {
        return 0;
    }


    const primero =
        slides[0].getBoundingClientRect();

    const segundo =
        slides[1].getBoundingClientRect();


    return segundo.left - primero.left;

}


/* ========================================
   COLOCAR LA FOTO ACTUAL EN EL CENTRO
   ======================================== */

function colocarHistoriaEnCentro() {

    const ancho =
        obtenerAnchoHistoria();


    historiaPista.style.transform =
        `translateX(-${ancho}px)`;

}


/* ========================================
   SIGUIENTE
   ======================================== */

function siguienteHistoria() {

    if (historiaAnimando) {
        return;
    }


    historiaAnimando = true;


    const ancho =
        obtenerAnchoHistoria();


    historiaPista.style.transform =
        `translateX(-${ancho * 2}px)`;


    historiaPista.addEventListener(
        "transitionend",
        finalizarSiguienteHistoria,
        { once: true }
    );

}


/* ========================================
   FINALIZAR SIGUIENTE
   ======================================== */

function finalizarSiguienteHistoria() {

    historiaPista.style.transition =
        "none";


    historiaActual =
        (historiaActual + 1)
        % historiaFotos.length;


    actualizarTresFotos();

    colocarHistoriaEnCentro();


    historiaPista.offsetHeight;


    historiaPista.style.transition =
        "";


    historiaAnimando = false;


    actualizarHistoriaVisorSiEstaAbierto();

}


/* ========================================
   ANTERIOR
   ======================================== */

function anteriorHistoria() {

    if (historiaAnimando) {
        return;
    }


    historiaAnimando = true;


    historiaPista.style.transform =
        "translateX(0)";


    historiaPista.addEventListener(
        "transitionend",
        finalizarAnteriorHistoria,
        { once: true }
    );

}


/* ========================================
   FINALIZAR ANTERIOR
   ======================================== */

function finalizarAnteriorHistoria() {

    historiaPista.style.transition =
        "none";


    historiaActual =
        (historiaActual - 1 + historiaFotos.length)
        % historiaFotos.length;


    actualizarTresFotos();

    colocarHistoriaEnCentro();


    historiaPista.offsetHeight;


    historiaPista.style.transition =
        "";


    historiaAnimando = false;


    actualizarHistoriaVisorSiEstaAbierto();

}


/* ========================================
   ACTUALIZAR VISOR SI ESTÁ ABIERTO
   ======================================== */

function actualizarHistoriaVisorSiEstaAbierto() {

    if (
        historiaVisor &&
        historiaVisor.classList.contains("abierto")
    ) {

        actualizarHistoriaVisor();

    }

}


/* ========================================
   REINICIAR TEMPORIZADOR
   ======================================== */

function reiniciarHistoriaTemporizador() {

    clearInterval(
        historiaTemporizador
    );


    historiaTemporizador =
        setInterval(
            siguienteHistoria,
            6000
        );

}


/* ========================================
   BOTÓN SIGUIENTE
   ======================================== */

historiaSiguiente.addEventListener(
    "click",
    () => {

        if (historiaAnimando) {
            return;
        }


        siguienteHistoria();

        reiniciarHistoriaTemporizador();

    }
);


/* ========================================
   BOTÓN ANTERIOR
   ======================================== */

historiaAnterior.addEventListener(
    "click",
    () => {

        if (historiaAnimando) {
            return;
        }


        anteriorHistoria();

        reiniciarHistoriaTemporizador();

    }
);


/* ========================================
   INICIALIZAR CARRUSEL
   ======================================== */

actualizarTresFotos();


historiaPista.style.transition =
    "none";


colocarHistoriaEnCentro();


historiaPista.offsetHeight;


historiaPista.style.transition =
    "";


reiniciarHistoriaTemporizador();

/* ========================================
   VISOR — NUESTRA HISTORIA
   ======================================== */

const historiaVisor =
    document.getElementById(
        "historia-visor"
    );

const historiaVisorFoto =
    document.getElementById(
        "historia-visor-foto"
    );

const historiaVisorFrase =
    document.getElementById(
        "historia-visor-frase"
    );

const historiaVisorCerrar =
    document.getElementById(
        "historia-visor-cerrar"
    );

const historiaVisorAnterior =
    document.getElementById(
        "historia-visor-anterior"
    );

const historiaVisorSiguiente =
    document.getElementById(
        "historia-visor-siguiente"
    );


/* ========================================
   MOSTRAR FOTO EN EL VISOR
   ======================================== */

function actualizarHistoriaVisor() {

    historiaVisorFoto.src =
        historiaFotos[historiaActual];

    historiaVisorFoto.alt =
        historiaFrases[historiaActual];

    historiaVisorFrase.textContent =
        historiaFrases[historiaActual];

}


/* ========================================
   ABRIR VISOR
   ======================================== */

historiaFoto.addEventListener(
    "click",
    () => {

        actualizarHistoriaVisor();

        historiaVisor.classList.add(
            "abierto"
        );

        historiaVisor.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

    }
);


/* ========================================
   CERRAR VISOR
   ======================================== */

function cerrarHistoriaVisor() {

    historiaVisor.classList.remove(
        "abierto"
    );

    historiaVisor.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

}


/* ========================================
   BOTÓN CERRAR
   ======================================== */

historiaVisorCerrar.addEventListener(
    "click",
    cerrarHistoriaVisor
);


/* ========================================
   FOTO ANTERIOR
   ======================================== */

historiaVisorAnterior.addEventListener(
    "click",
    () => {

        anteriorHistoria();

        actualizarHistoriaVisor();

        reiniciarHistoriaTemporizador();

    }
);


/* ========================================
   FOTO SIGUIENTE
   ======================================== */

historiaVisorSiguiente.addEventListener(
    "click",
    () => {

        siguienteHistoria();

        actualizarHistoriaVisor();

        reiniciarHistoriaTemporizador();

    }
);


/* ========================================
   CERRAR AL PULSAR FUERA
   ======================================== */

historiaVisor.addEventListener(
    "click",
    evento => {

        if (
            evento.target === historiaVisor
        ) {

            cerrarHistoriaVisor();

        }

    }
);


/* ========================================
   ESC PARA CERRAR
   ======================================== */

document.addEventListener(
    "keydown",
    evento => {

        if (
            evento.key === "Escape" &&
            historiaVisor.classList.contains(
                "abierto"
            )
        ) {

            cerrarHistoriaVisor();

        }

    }
);

/* ========================================
   DESLIZAR — VISOR NUESTRA HISTORIA
   ======================================== */

let historiaInicioX = 0;
let historiaFinX = 0;


/* ========================================
   COMIENZA EL DESLIZAMIENTO
   ======================================== */

historiaVisor.addEventListener(
    "touchstart",
    evento => {

        historiaInicioX =
            evento.touches[0].clientX;

    },
    { passive: true }
);


/* ========================================
   TERMINA EL DESLIZAMIENTO
   ======================================== */

historiaVisor.addEventListener(
    "touchend",
    evento => {

        historiaFinX =
            evento.changedTouches[0].clientX;

        const distancia =
            historiaFinX - historiaInicioX;


        /* Deslizamiento demasiado pequeño */

        if (Math.abs(distancia) < 50) {

            return;

        }


        /* Deslizar hacia la izquierda */

        if (distancia < 0) {

            siguienteHistoria();

            actualizarHistoriaVisor();

            reiniciarHistoriaTemporizador();

        }


        /* Deslizar hacia la derecha */

        else {

            anteriorHistoria();

            actualizarHistoriaVisor();

            reiniciarHistoriaTemporizador();

        }

    },
    { passive: true }
);