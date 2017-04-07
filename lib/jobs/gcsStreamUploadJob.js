const redis = require("./../redis");
const queue = require("./jobQueue");
const events = require("./../buffers").events;
const files = require("./../buffers").files;
const StopWatch = require("./stopwatch");
const logger = require("./../logger")("gcs-upload-job");

const JOB_NAME = "gcs-upload";
const SCHEDULE = require("../config").options.gcsUploadSchedule;

const FILE_PREFIX = "events";

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

  const size = await events.size(id);
  stopWatch.split("size");
  logger.info(`check size: ${size} docs, took`, stopWatch.getSplitTime("size"), "msec");

  const file = `${FILE_PREFIX}_${id}.dat`;

  if (progress.status < STATUS_UPLOADED) {
    const gcStream = files.gcStream(file);
    await events.stream(id, gcStream);

    job.progress(STATUS_UPLOADED, STATUSES, {status: STATUS_UPLOADED});

    stopWatch.split("upload");
    logger.info("finished stream to gcs, took", stopWatch.getSplitTime("upload"), "msec");
  }

  await files.trackFile(file);
  await events.remove(id);

  stopWatch.stop();
  logger.info("finish processing, stats: ", stopWatch.toJSON());
}

module.exports.schedule = () => {
  new queue.schedule(JOB_NAME, SCHEDULE, process);
};