const Redis = require("ioredis");
const pool = require("generic-pool");

const factory = {
  create: function(){
    return new Promise(function(resolve, reject){
      const client = Redis();
      resolve(client);
    })
  },
  destroy: function(client){
    return new Promise(function(resolve){
      client.disconnect();
      resolve();
    })
  }
};

const opts = {
  max: 100,
  min: 10
};

const redisPool = pool.createPool(factory, opts);

module.exports = redisPool;
module.exports.createClient = () => Redis();