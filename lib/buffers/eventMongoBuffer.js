const JSONStream = require('JSONStream');
const db = require("./../mongo");

const COLLECTION_NAME = "events";

class EventsBuffer {

  async store(event) {
    await db[COLLECTION_NAME].save(event);
  }

  async rotate(tag) {
    const collName = this._collectionName(tag);
    const result = await db.runCommand({ eval: `function () {db.${COLLECTION_NAME}.renameCollection("${collName}")}` });
    return result.ok;
  }

  async readBatch(tag, from, batchSize) {
    const collName = this._collectionName(tag);
    const result = await db[collName].find().sort({_id: 1}).skip(from).limit(batchSize).toArray();
    return result.length ? result.map(v => JSON.stringify(v)) : undefined;
  }

  async stream(tag, dest) {
    const collName = this._collectionName(tag);
    await new Promise((resolve, reject) => {
      db[collName].find().pipe(JSONStream.stringify()).pipe(dest).on("error", reject).on("finish", resolve);
    });
  }

  async size(tag) {
    const collName = this._collectionName(tag);
    return await db[collName].count();
  }

  async remove(tag) {
    const collName = this._collectionName(tag);
    return await db[collName].drop();
  }

  _collectionName(tag) {
    return `${COLLECTION_NAME}_${tag}`;
  }
}

module.exports = new EventsBuffer();