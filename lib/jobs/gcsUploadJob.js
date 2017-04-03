const redis = require("./../redis");
const queue = require("./jobQueue");
const events = require("./../buffers/eventBuffer");
const files = require("./../buffers/filesBuffer");
const StopWatch = require("./stopwatch");
const logger = require("./../logger")("gcs-upload-job");

const JOB_NAME = "gcs-upload";
const SCHEDULE = "0 * * * * *";

const FILE_PREFIX = "events";
const BATCH_SIZE = 1000;

const STATUS_ROTATED = 1;
const STATUS_UPLOADED = 2;
const STATUSES = 3;

async function process(job) {
  const stopWatch = new StopWatch();
  stopWatch.start();

  const id = job.id;
  const progress = job.progress_data || { status: 0 };

  if (progress.status < STATUS_ROTATED) {
    const rotated = await events.rotate(id);
    if (!rotated) {
      logger.info("nothing to process");
      return;
    }

    job.progress(STATUS_ROTATED, STATUSES, {status: STATUS_ROTATED});

    stopWatch.split("rotate");
    logger.info("rotated files list, took", stopWatch.getSplitTime("rotate"), "msec");
  }

  const file = `${FILE_PREFIX}_${id}.dat`;

  if (progress.status < STATUS_UPLOADED) {
    if (await files.fsExists(file)) {
      await files.fsRemove(file);
    }
    let read = 0;
    while (true) {
      const items = await events.readBatch(id, read, BATCH_SIZE);
      if (!items) {
        break;
      }
      read += BATCH_SIZE;
      const content = items.join("\n") + "\n";
      await files.fsAppend(file, content);
    }

    stopWatch.split("file");
    logger.info("created file from redis list, took", stopWatch.getSplitTime("file"), "msec");

    await files.gcUpload(file);

    job.progress(STATUS_UPLOADED, STATUSES, {status: STATUS_UPLOADED});

    stopWatch.split("upload");
    logger.info("uploaded files to gcs, took", stopWatch.getSplitTime("upload"), "msec");
  }

  await files.trackFile(file);
  await events.remove(id);
  await files.fsRemove(file);

  stopWatch.stop();
  logger.info("finish processing, stats: ", stopWatch.toJSON());
}

module.exports.schedule = () => {
  new queue.schedule(JOB_NAME, SCHEDULE, process);
};