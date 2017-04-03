const redis = require("./../redis");
const kue = require("kue");
const cron = require("cron-cluster");
const logger = require("./../logger")("queue");

const CronJob = cron(redis.createClient()).CronJob;

const queue = kue.createQueue({
  prefix: "bq-queue",
  redis: {
    createClientFactory: () => {
      return redis.createClient();
    }
  }
});

queue.on("error", function( err ) {
  logger.error(err, "Failed to run job");
});

function schedule(jobName, cronTime, handle) {
  logger.info("submit job", jobName, cronTime);
  new CronJob(cronTime, () => {
    logger.info("schedule", jobName);
    queue.create(jobName, {}).attempts(3).save();
  }, null, true);
  queue.process(jobName, async(job, done) => {
    logger.info(`start job ${jobName} #${job.id}`);
    try {
      const result = await handle(job);
      logger.info(`complete job ${jobName} #${job.id}`, result);
      done();
    } catch (err) {
      logger.error(err, `failed job ${jobName} #${job.id}`);
      done(err);
    }
  });
}

module.exports.schedule = schedule;
