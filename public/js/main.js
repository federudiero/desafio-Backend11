const socket = io.connect();

//------------------------------------------------------------------------------------

const formAgregarProducto = document.getElementById("formAgregarProducto");
formAgregarProducto.addEventListener("submit", (e) => {
  e.preventDefault();
  //Armar objeto producto y emitir mensaje a evento update
  // Creo el objeto que voy a enviar por socket
  const title = document.getElementById("nombre").value;
  const price = parseFloat(document.getElementById("precio").value);
  const thumbnail = document.getElementById("foto").value;
  const product = { title, price, thumbnail };
  // envio por socket
  socket.emit("newProduct", product);
  // resetteo el formulario para que aparezca vacio
  formAgregarProducto.reset();
});

socket.on("productos", async (productos) => {
  //generar el html y colocarlo en el tag productos llamando al funcion makeHtmlTable
  // Corro makeHtmlTable para generar el html
  const html = await makeHtmlTable(productos);
  // pongo el html generado dentro del div productos
  document.getElementById("productos").innerHTML = html;
});

async function makeHtmlTable(productos) {
  return fetch("plantillas/tabla-productos.hbs")
    .then((respuesta) => respuesta.text())
    .then((plantilla) => {
      const template = Handlebars.compile(plantilla);
      const html = template({ productos });
      return html;
    });
}

//-------------------------------------------------------------------------------------

const username = document.getElementById("username");
const firstname = document.getElementById("firstname");
const lastname = document.getElementById("lastname");
const age = document.getElementById("age");
const alias = document.getElementById("alias");
const avatar = document.getElementById("avatar");
const inputMensaje = document.getElementById("inputMensaje");

const btnEnviar = document.getElementById("btnEnviar");

const formPublicarMensaje = document.getElementById("formPublicarMensaje");
formPublicarMensaje.addEventListener("submit", (e) => {
  e.preventDefault();
  // creo el objeto y lo envio
  const message = {
    author: {
      id: username.value,
      nombre: firstname.value,
      apellido: lastname.value,
      edad: age.value,
      alias: alias.value,
      avatar: avatar.value
    },
    text: inputMensaje.value
  };
  socket.emit("newMessage", message);
  //Armar el objeto de mensaje y luego emitir mensaje al evento nuevoMensaje con sockets
  formPublicarMensaje.reset();
  inputMensaje.focus();
});

socket.on("mensajes", async (normalizedMsgs) => {
  const initSize = JSON.stringify(normalizedMsgs).length;
  const denormalizedMensajes = denormalizeData(normalizedMsgs);

  const finalSize = JSON.stringify(denormalizedMensajes).length;
  const compresion = Math.round((initSize / finalSize) * 100);
  document.getElementById("compresion-info").innerText = compresion;
  //generar el html y colocarlo en el tag productos llamando al funcion makeHtmlTable
  // en este caso cree otra funcion para hacer los mensajes con el formato que pide la consigna
  const html = await makeHtmlMessages(denormalizedMensajes.mensajes);
  // cargo ese html generado en el div mensajes
  document.getElementById("mensajes").innerHTML = html;
});

async function makeHtmlMessages(mensajes) {
  // es la misma funcion que htmlTables, solo que le cambio la plantilla
  return fetch("plantillas/mensajes.hbs")
    .then((respuesta) => respuesta.text())
    .then((plantilla) => {
      const template = Handlebars.compile(plantilla);
      const html = template({ mensajes });
      return html;
    });
}
document.addEventListener("input", () => {
  if (!username.value || !firstname.value || !lastname.value || !age.value || !alias.value || !avatar.value) {
    inputMensaje.disabled = true;
    btnEnviar.disabled = true;
  } else {
    inputMensaje.disabled = false;
    if (!inputMensaje.value) {
      btnEnviar.disabled = true;
    } else {
      btnEnviar.disabled = false;
    }
  }
});

const denormalizeData = (normalizedData) => {
  const schema = normalizr.schema;
  const author = new schema.Entity("author", { idAttribute: "email" });
  const mensaje = new schema.Entity("mensaje", { author: author });
  const mensajes = new schema.Entity("mensajes", { mensajes: [mensaje] });
  const denormalize = normalizr.denormalize;
  return denormalize(normalizedData.result, mensajes, normalizedData.entities);
};