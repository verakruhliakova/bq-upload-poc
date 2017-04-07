const redis = require("./../redis");
const queue = require("./jobQueue");
const filesBuffer = require("./../buffers").files;
const BigQuery = require("@google-cloud/bigquery");
const StopWatch = require("./stopwatch");
const logger = require("./../logger")("bq-upload-job");
const config = require("./../config");

const JOB_NAME = "bq-upload";
const SCHEDULE = require("../config").options.bqUploadSchedule;

const STATUS_ROTATED = 1;
const STATUS_UPLOADED = 2;
const STATUSES = 3;

const bigQuery = BigQuery(config.google);

async function process(job) {
  const stopWatch = new StopWatch();
  stopWatch.start();

  const id = job.id;
  const progress = job.progress_data || { status: 0 };

  if (progress.status < STATUS_ROTATED) {
    const rotated = await filesBuffer.rotate(id);
    if (!rotated) {
      logger.info("nothing to process", id);
      return;
    }

    job.progress(STATUS_ROTATED, STATUSES, {status: STATUS_ROTATED});

    stopWatch.split("rotate");
    logger.info("rotated files list, took", stopWatch.getSplitTime("rotate"), "msec");
  }

  if (progress.status < STATUS_UPLOADED) {
    const files = await filesBuffer.gcList(id);
    const table = bigQuery.dataset(config.bigQuery.dataset).table(config.bigQuery.table);
    const result = await table.import(files, {format: 'JSON'});
    console.log(JSON.stringify(result));

    job.progress(STATUS_UPLOADED, STATUSES, {status: STATUS_UPLOADED});

    stopWatch.split("upload");
    logger.info(`uploaded ${files.length} files to bigquery, took`, stopWatch.getSplitTime("upload"), "msec");
  }

  await filesBuffer.remove(id);

  stopWatch.stop();
  logger.info("finish processing, stats: ", stopWatch.toJSON());
}

module.exports.schedule = () => {
  queue.schedule(JOB_NAME, SCHEDULE, process);
};