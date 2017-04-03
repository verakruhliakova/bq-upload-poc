const bole = require("bole");

bole.output({
  level: "debug",
  stream: process.stdout
});

module.exports = bole("bq-upload-poc");