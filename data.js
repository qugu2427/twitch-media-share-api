let current = null;
let queue = [];
let dequeueAt = 0; // time at wich next dequeue should happen
let votes = {
  likes: 0,
  dislikes: 0,
  users: {},
};
let connections = 0;

const getCurrent = function () {
  return current;
};

const getQueue = function () {
  return queue;
};

const enqueue = function (obj) {
  queue.push(obj);
};

const shiftQueue = function () {
  current = queue.shift();
  dequeueAt = Date.now() + current.duration * 1000;
};

const getConnections = function () {
  return connections;
};

const incrementConnections = function () {
  connections++;
};

const decrementConnections = function () {
  connections--;
};

const vote = function (name, like) {
  if (votes.users[name] != null) {
    console.log(votes.users[name]);
    if (votes.users[name]) {
      console.log("YO");
      votes.likes--;
      console.log(votes.likes);
    } else {
      votes.dislikes--;
    }
    delete votes.users[name];
  }
  votes.users[name] = like;
  if (like) {
    votes.likes++;
  } else {
    votes.dislikes++;
  }
  return { likes: votes.likes, dislikes: votes.dislikes };
};

const getDequeueAt = function () {
  return dequeueAt;
};

const setDequeueAt = function (t) {
  dequeueAt = t;
};

const resetVotes = function () {
  votes.likes = 0;
  votes.dislikes = 0;
  votes.users = {};
};

const queueFull = function () {
  return queue.length >= 25;
};

const getVotes = function () {
  return { likes: votes.likes, dislikes: votes.dislikes };
};

const shouldSkip = function () {
  if (connections < 4 && votes.likes > votes.dislikes) {
    return true;
  } else if (
    votes.likes - votes.dislikes < Math.ceil(votes.likes / 3) &&
    votes.dislikes > 3
  ) {
    return true;
  }
  return false;
};

module.exports = {
  getCurrent,
  getQueue,
  enqueue,
  shiftQueue,
  getConnections,
  incrementConnections,
  decrementConnections,
  vote,
  getDequeueAt,
  setDequeueAt,
  resetVotes,
  queueFull,
  getVotes,
  shouldSkip,
};
