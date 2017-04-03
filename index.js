const server = require("./lib/server");
const logger = require("./lib/logger");

server.start();

require("./lib/jobs/gcsUploadJob").schedule();
require("./lib/jobs/bigQueryUploadJob").schedule();

process.on("unhandledException", (err) => {
  logger.error(err, "unhandled exception... have to die...");
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.warn(err, "unhandled rejection");
});