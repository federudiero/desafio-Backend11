import normalizr from "normalizr";


const normalize = normalizr.normalize;
const schema = normalizr.schema;

const author = new schema.Entity("author", { idAttribute: "email" });
const mensaje = new schema.Entity("mensaje", { author: author });
const mensajes = new schema.Entity("mensajes", { mensajes: [mensaje] });
export const getNormalized = (data) => {

    
  return normalize(data, mensajes);
};