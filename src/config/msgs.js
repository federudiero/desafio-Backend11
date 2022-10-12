import mongoose from "mongoose";

export const msgsCollection = "mensajes";

const authorSchema = new mongoose.Schema({
  id: String,
  nombre: String,
  apellido: String,
  edad: String,
  alias: String,
  avatar: String,
});

export const msgsSchema = new mongoose.Schema({
  author: authorSchema,
  text: String,
});