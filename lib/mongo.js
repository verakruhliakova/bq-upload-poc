const mongojs = require("promised-mongo");
const db = mongojs("localhost:27017/buffer");

module.exports = db;