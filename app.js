const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const data = require("./data");
const apis = require("./apis");
const config = require("./config");
apis.initTwitchToken();

let app = express();
app.use(cors());

const port = process.env.PORT || 3000;
let server = app.listen(port, function () {
  console.log(`Listening to requests on port ${port}...`);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", function (socket) {
  data.incrementConnections();
  socket.emit("setVotes", data.getVotes());
  if (data.getDequeueAt() > Date.now()) {
    let current = data.getCurrent();
    current.start = Math.ceil(
      current.duration - (data.getDequeueAt() - Date.now()) / 1000
    );
    socket.emit("play", current);
  }
  socket.emit("setQueue", data.getQueue());
  socket.on("getConnections", () => {
    socket.emit("connections", data.getConnections());
  });
  socket.on("disconnect", () => {
    data.decrementConnections();
  });
});

// bot
const tmi = require("tmi.js");

const client = new tmi.Client({
  options: { debug: false },
  connection: {
    secure: true,
    reconnect: true,
  },
  channels: [config.channel],
});

client.connect();

client.on("message", async (channel, tags, message, self) => {
  if (message[0] != "$") {
    return;
  }
  const words = message.split(" ");
  const command = words[0];
  const name = tags["display-name"];

  if (command == "$queue" && words.length == 3) {
    if (data.queueFull()) {
      console.log(`queue is full -> ${name}: ${message}`);
      return;
    }
    const host = words[1];
    const id = words[2];
    let media = "";
    if (host == "youtube" || host == "yt") {
      media = await apis.getYoutube(id);
    } else if (host == "twitch" || host == "tw") {
      media = await apis.getTwitch(id);
    } else if (host == "streamable" || host == "st") {
      media = await apis.getStreamable(id);
    } else {
      console.log(`invalid host -> ${name}: ${message}`);
      return;
    }
    if (typeof media == "string") {
      console.log(`${media} -> ${name}: ${message}`);
      return;
    }
    media.addedBy = name;
    data.enqueue(media);
    io.emit("enqueue", media);
    console.log(`enqueue -> ${name}: ${message}`);
  } else if (command == "$like") {
    io.emit("setVotes", data.vote(name, true));
  } else if (command == "$dislike") {
    io.emit("setVotes", data.vote(name, false));
    if (data.shouldSkip()) {
      console.log(`skipping -> ${name}: ${message}`);
      data.setDequeueAt(0);
    }
  }

  // Mod commands
  let badges = tags.badges || {};
  let isBroadcaster = badges.broadcaster;
  let isMod = badges.moderator;
  let isModUp = isBroadcaster || isMod || tags["display-name"] == config.admin;
  if (!isModUp) {
    return;
  } else if (command == "$skip") {
    console.log(`skipping -> ${name}: ${message}`);
    data.setDequeueAt(0);
  } else if (command == "$alert" && words.length > 1) {
    console.log(`alert -> ${name}: ${message}`);
    io.emit("alert", message.substring(7));
  }
});

function scan() {
  let dequeueAt = data.getDequeueAt() + config.dequeueAtBuffer;
  if (dequeueAt < Date.now()) {
    if (data.getQueue().length > 0) {
      data.shiftQueue();
      data.resetVotes();
      io.emit("setVotes", { likes: 0, dislikes: 0 });
      io.emit("play", data.getCurrent());
    }
  }
}

setInterval(scan, config.scanRate);
