const redis = require("./../redis");
const fs = require("fs");
const GCStorage = require("@google-cloud/storage");
const config = require("./../config");

const FILES_LIST = "gc-files";

const gcStorage = GCStorage(config.google);

class FileBuffer {

  async trackFile(file) {
    const client = await redis.acquire();
    try {
      await client.lpush(FILES_LIST, file);
    } finally {
      redis.release(client);
    }
  }

  async rotate(tag) {
    const newList = this._listName(tag);
    const client = await redis.acquire();
    try {
      await client.rename(FILES_LIST, newList);
      return true;
    } catch (err) {
      if (err.message.indexOf("no such key")) {
        return false;
      }
      throw err;
    } finally {
      redis.release(client);
    }
  }

  async readAll(tag) {
    const list = this._listName(tag);
    const client = await redis.acquire();
    try {
      let items = [];
      const batchSize = 1000;
      let read = 0;
      while (true) {
        const batch = await client.lrange(list, read, batchSize);
        if (!batch || !batch.length) {
          break;
        }
        read += batchSize;
        items = items.concat(batch);
      }
      return items;
    } finally {
      redis.release(client);
    }
  }

  async remove(tag) {
    const list = this._listName(tag);
    const client = await redis.acquire();
    try {
      await client.del(list);
    } finally {
      redis.release(client);
    }
  }

  async fsExists(file) {
    return new Promise((resolve, reject) => {
      fs.access(file, (err) => {
        if (err) {
          if (err.code === "ENOENT") {
            resolve(false);
          } else {
            reject(err);
          }
        } else {
          resolve(true);
        }
      });
    });
  }

  async fsRemove(file) {
    return new Promise((resolve, reject) => {
      fs.unlink(file, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async fsAppend(file, content) {
    return new Promise((resolve, reject) => {
      fs.appendFile(file, content, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async gcUpload(file) {
    await gcStorage.bucket(config.googleStorage.bucket).upload(file);
  }

  gcStream(file) {
    const bucket = gcStorage.bucket(config.googleStorage.bucket);
    return bucket.file(file).createWriteStream();
  }

  async gcList(tag) {
    const bucket = gcStorage.bucket(config.googleStorage.bucket);
    const fileNames = await this.readAll(tag);
    return fileNames.map(fileName => bucket.file(fileName));
  }

  _listName(tag) {
    return `${FILES_LIST}:${tag}`;
  }
}

module.exports = new FileBuffer();