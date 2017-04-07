const config = require("../config");

module.exports = {
  events: config.options.buffer === "mongo" ? require("./eventMongoBuffer") : require("./eventRedisBuffer"),
  files: require("./filesBuffer")
};