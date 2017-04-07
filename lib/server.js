const express = require("express");
const bodyParser = require("body-parser");
const events = require("./buffers").events;

const app = express().use(bodyParser.json());

app.post("/", async(req, res) => {
  await events.store(req.body);
  res.send("ok");
});

module.exports.start = () => {
  app.listen(3000);
};