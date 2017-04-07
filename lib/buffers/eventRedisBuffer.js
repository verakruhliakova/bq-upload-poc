const redis = require("./../redis");

const EVENTS_LIST = "events";

class EventsBuffer {

  async store(event) {
    const client = await redis.acquire();
    try {
      await client.lpush(EVENTS_LIST, JSON.stringify(event));
    } finally {
      redis.release(client);
    }
  }

  async rotate(tag) {
    const newList = this._listName(tag);
    const client = await redis.acquire();
    try {
      await client.rename(EVENTS_LIST, newList);
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

  async readBatch(tag, from, batchSize) {
    const list = this._listName(tag);
    const client = await redis.acquire();
    try {
      const items = await client.lrange(list, from, from + batchSize - 1);
      return (!items || !items.length) ? undefined : items;
    } finally {
      redis.release(client);
    }
  }

  async stream(tag, dest) {
    const batchSize = 1000;
    let read = 0;
    while (true) {
      const items = await this.readBatch(tag, read, batchSize);
      if (!items) {
        break;
      }
      read += batchSize;
      const content = items.join("\n") + "\n";
      await new Promise((resolve, reject) => {
        dest.write(content, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        })
      });
    }
    dest.end();
  }

  async size(tag) {
    const list = this._listName(tag);
    const client = await redis.acquire();
    try {
      return await client.llen(list);
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

  _listName(tag) {
    return `${EVENTS_LIST}:${tag}`;
  }
}

module.exports = new EventsBuffer();