#!/usr/bin/env node
const chokidar = require("chokidar");
const { spawn } = require("child_process");
const fs = require("fs");

const w1 = chokidar.watch(["*.mkv", "*.mp4", "*.mov", "*.m4v", "*.flv"], {
  ignored: [/(^|[\/\\])\../, "./anyway/", "./ok/", "./audio/"],
  persistent: true
});

let queue = [];

function swapExt(path, ext) {
  return path.substring(0, path.lastIndexOf(".")) + "." + ext;
}

function encodeVideo(path, callback) {
  // keep same behavior as encode_all.sh does
  console.log(path);
  const proc = spawn("./encode.sh", [path], {
    detached: true,
    stdio: ["ignore", "inherit", "inherit"]
  });
  proc.on("exit", callback);
  proc.on("error", function() {
    console.log("proc err", ...arguments);
    callback();
  });
}

function randomWait(callback) {
  // that's ok to use Math.random as this is not for sensitive data
  setTimeout(callback, 500 + 1000 * Math.random());
}

function loop() {
  if (queue.length > 0) {
    return randomWait(() => {
      encodeVideo(queue.shift(), loop);
    });
  }
  randomWait(loop);
}

w1.on("add", path => {
  fs.stat(swapExt(path, "webm"), err => {
    if (err) {
      queue.push(path);
    }
  });
});

loop();
