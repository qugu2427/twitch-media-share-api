const fetch = require("node-fetch");
const config = require("./config");
let twitchToken = "";

const initTwitchToken = async function () {
  try {
    let res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${config.twitchClientID}&client_secret=${config.twitchSecret}&grant_type=client_credentials`,
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + config.twitchSecret,
          "Client-ID": config.twitchClientID,
        },
      }
    );
    res = await res.json();
    twitchToken = res.access_token;
    console.log("fetched token - " + twitchToken);
    setTimeout(function () {
      initTwitchToken();
    }, 10800000);
  } catch (err) {
    console.log("failed to init twitch token");
  }
};

// function from stack overflow
function YTDurationToSeconds(duration) {
  let match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  match = match.slice(1).map(function (x) {
    if (x != null) {
      return x.replace(/\D/, "");
    }
  });
  let hours = parseInt(match[0]) || 0;
  let minutes = parseInt(match[1]) || 0;
  let seconds = parseInt(match[2]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

// get will return an object if validated or string if invalid
const getYoutube = async function (id) {
  try {
    let media = {
      host: "youtube",
      id: id,
      title: "",
      addedBy: "",
      duration: -1,
      start: 0,
    };
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) {
      return "invalid id";
    }
    let res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet%2C+contentDetails%2C+status&id=${id}&key=${config.youtubeKey}`
    );
    if (res.status < 200 || res.status > 299) {
      return `youtube responded with status ${res.status}`;
    }
    res = await res.json();
    if (res.items.length != 1) {
      return "video not found";
    }
    if (res.items[0].kind != "youtube#video") {
      return "media not of type youtube#video";
    }
    if (!res.items[0].status.embeddable) {
      return "video not embeddable";
    }
    media.duration = YTDurationToSeconds(res.items[0].contentDetails.duration);
    media.title = res.items[0].snippet.title;
    return media;
  } catch (err) {
    console.log(err);
    return "failed to get youtube video";
  }
};

const getTwitch = async function (id) {
  try {
    let media = {
      host: "twitch",
      id: id,
      title: "",
      addedBy: "",
      duration: -1,
      start: 0,
    };
    let res = await fetch(`https://api.twitch.tv/helix/clips?id=${id}`, {
      headers: {
        Authorization: "Bearer " + twitchToken,
        "Client-ID": config.twitchClientID,
      },
    });
    if (res.status < 200 || res.status > 299) {
      return `twitch responded with status ${res.status}`;
    }
    res = await res.json();
    if (res.data.length != 1) {
      return "clip not found";
    }
    let clip = res.data[0];
    media.title = clip.title;
    media.duration = Math.ceil(clip.duration);
    return media;
  } catch (err) {
    return "failed to fetch twitch clip";
  }
};

const getStreamable = async function (id) {
  try {
    let media = {
      host: "streamable",
      id: id,
      title: "",
      addedBy: "",
      duration: -1,
      start: 0,
    };
    let res = await fetch(`https://api.streamable.com/videos/${id}`);
    if (res.status < 200 || res.status > 299) {
      return `streamable responded with status ${res.status}`;
    }
    res = await res.json();
    media.title = res.title;
    media.duration = Math.ceil(res.files.original.duration);
    return media;
  } catch (err) {
    return "failed to fetch streamable";
  }
};

module.exports = {
  initTwitchToken,
  getYoutube,
  getTwitch,
  getStreamable,
};
