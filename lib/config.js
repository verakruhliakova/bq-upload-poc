const config = {
  google: {
    projectId: "project1234",
    keyFilename: "google.json"
  },

  googleStorage: {
    bucket: "store1234"
  },

  bigQuery: {
    dataset: "dataset1234",
    table: "events"
  },

  options: {
    buffer: "redis",
    stream: true,
    gcsUploadSchedule: "0 * * * * *",
    bqUploadSchedule: "0 */5 * * * *"
  }
};

module.exports = config;