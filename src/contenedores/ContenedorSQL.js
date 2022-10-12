import knex from "knex";

class ContenedorSQL {
  constructor(config, tabla) {
    this.knex = knex(config);
    this.tabla = tabla;
  }

  async listar(id) {
    try {
      const resultado = await this.knex(this.tabla).where("id", id).select("*");
      const data = JSON.parse(JSON.stringify(resultado));
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async listarAll() {
    try {
      const resultado = await this.knex(this.tabla).select("*");
      const data = JSON.parse(JSON.stringify(resultado));
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async guardar(elem) {
    try {
      const elemId = await this.knex(this.tabla).insert(elem);
      return elemId;
    } catch (error) {
      console.log(error);
    }
  }

  async actualizar(elem, id) {
    try {
      await this.knex(this.tabla).where("id", id).update(elem);
    } catch (error) {
      console.log(error);
    }
  }

  async borrar(id) {
    try {
      await this.knex(this.tabla).where("id", id).del();
    } catch (error) {
      console.log(error);
    }
  }

  async borrarAll() {
    try {
      await this.knex(this.tabla).del();
    } catch (error) {
      console.log(error);
    }
  }

  async desconectar() {
    try {
      await this.knex.destroy();
    } catch (error) {
      console.log(error);
    }
  }
}

export default ContenedorSQL;