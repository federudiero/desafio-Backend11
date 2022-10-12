import mongoose from "mongoose";
import * as objectUtils from "../utils/objectUtils.js";

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

await mongoose.connect("mongodb://localhost:27017/testdb", options);

export default class MongoDbContainer {
  constructor(collectionString, schema) {
    this.model = mongoose.model(collectionString, schema);
  }

  async getById(id) {
    const data = await this.model.findOne({ _id: id });
    const plainData = objectUtils.returnPlainObj(data);
    const item = objectUtils.renameField(plainData, "_id", "id");
    return item;
  }

  async getAll() {
    const data = await this.model.find({});
    const plainData = objectUtils.returnPlainObj(data);
    const items = plainData.map((item) => objectUtils.renameField(item, "_id", "id"));
    return items;
  }

  async getByField(field, criteria) {
    const data = await this.model.findOne().where(field).equals(criteria);
    const plainData = objectUtils.returnPlainObj(data);
    const item = objectUtils.renameField(plainData, "_id", "id");
    return item;
  }

  async createNew(itemData) {
    const newItem = await this.model.create(itemData);
  }

  async updateById(id, itemData) {
    await this.model.updateOne({ _id: id }, { $set: { ...itemData } });
  }

  async deleteById(id) {
    await this.model.deleteOne({ _id: id });
  }

  async deleteAll() {
    await this.model.deleteMany({});
  }
}