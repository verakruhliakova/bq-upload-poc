const useragent = require("express-useragent");

function random(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

const minTs = new Date("2017-04-01T00:00:00").getTime();
const maxTs = Date.now();

function randomDate() {
  return random(minTs, maxTs);
}

const eventTypes = ["start", "shutdown", "view", "click", "search", "signin", "signout",  "signup"];

const userAgents = require("./user_agents.json");

function randomFromList(list) {
  const i = random(0, list.length - 1);
  return list[i];
}

const productNames =
  ["Roku", "Chromecast", "Web", "Home Theater", "Android", "Samsung",
    "DLNA", "iOS", "Plex/iOS", "TV", "Xbox One", "Xbox 360", "Windows",
    "PleXBMC", "Windows Phone", "Media Player", "Apple TV"];

function randomIP() {
  const parts = [
    random(0, 255),
    random(0, 255),
    random(0, 255),
    random(0, 255)
  ];
  return parts.join(".");
}

function generate(requestId) {
  const ua = randomFromList(userAgents);
  const parsedUA = useragent.parse(ua);
  return {
    "properties": {},
    "context": {
      "device": {
        "device": parsedUA.os,
        "platform": parsedUA.platform,
        "product": randomFromList(productNames),
      },
      "ip": randomIP(),
      "location": null,
      "userAgent": ua
    },
    "timestamp": randomDate(),
    "interaction": random(0, 1) === 1,
    "event": randomFromList(eventTypes),
    "userId": String(random(1, 1000)),
    "deviceIdentifier": requestId.toString()
  };
}

module.exports = generate;
