#!/usr/bin/env node
const socks = require("socks-proxy-agent");
const puppeteer = require("puppeteer");
const axios_ = require("axios");

const args = process.argv.slice(2);
const account = args[0];

function wait(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

function scanMatches(re, s) {
  return s.match(re);
}

const noTor = process.env.NOTOR;

const proxy = "socks5://localhost:9050";
const agent = socks(proxy);
const axios = noTor
  ? axios_
  : axios_.create({ httpsAgent: agent, httpAgent: agent });

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function retry(func, cnt = 0) {
  return func().catch(r => {
    if (cnt > 3) {
      throw r;
    }
    return retry(func, ++cnt);
  });
}

// works if you don't have passwordless sudo configured
function reloadCircuit() {
  if (noTor) return Promise.resolve();
  return new Promise(resolve => {
    const client = new net.Socket();
    client.connect(9051, "127.0.0.1", function() {
      client.write('AUTHENTICATE ""\nSIGNAL NEWNYM');
    });

    client.on("data", function() {
      client.destroy();
    });

    client.on("close", resolve);
    client.on("error", resolve);
  });
}
// works if you have passwordless sudo configured
function restartTorService() {
  if (noTor) return Promise.resolve();
  return new Promise(resolve => {
    const proc = spawn("timeout", [
      "10s",
      "sudo",
      "systemctl",
      "restart",
      "tor"
    ]);
    proc.on("close", resolve);
    proc.on("error", resolve);
  });
}

async function randomWait() {
  const waitTime = parseInt(5000 + Math.random() * 2000);
  console.error(`Waiting ${waitTime}ms`);
  await wait(waitTime);
}
function testConnection() {
  return axios({ url: "http://checkip.amazonaws.com/" }).then(a =>
    console.log("Connection is OK")
  );
}

const imgRegex = /(https?:\/\/pbs\.twimg\.com\/media\/[^\" <>]+)/g;
const tweetRegex = /(?:https?:\/\/(?:www\.|m\.|mobile\.)?twitter\.com)?\/(?:[a-zA-Z0-9_]+)\/status\/(?:[0-9]+)/g;

(async () => {
  console.log("Opening");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"]
      .concat(
        process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
      )
      .concat(noTor ? [] : [`--proxy-server=${proxy}`])
  });
  let lastPage = "";
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.goto(
      // https://twitter.com/search?q=from%3Ajapan%20filter%3Avideos&src=typd
      `https://twitter.com/search?q=from%3A${account}%20filter%3Avideos&src=typd`,
      {
        timeout: 0
      }
    );
    let loadFlag = true;
    let count = 0;
    while (loadFlag) {
      count++;
      console.error(`Processing #${count}`);
      await page.evaluate(_ => {
        window.scrollTo(0, document.body.scrollHeight);
        document.querySelectorAll("video,iframe").forEach(function(item) {
          item.remove();
        });
      });
      await randomWait();
      loadFlag =
        count < 5 ||
        (process.env.CI &&
          (await page.evaluate(
            _ =>
              document.scrollingElement.scrollTop + window.innerHeight <
              document.scrollingElement.scrollHeight
          )));
      if (count == 1 && !loadFlag && proxy && !noTor) {
        let z;
        console.log("Trying to reload Tor circuits");
        for (z = 0; z < 5 && !loadFlag; z++) {
          await Promise.all([reloadCircuit(), restartTorService()]);
          await retry(testConnection, -Infinity);
          await page.goto(url, { timeout: 0 });
          await randomWait();
        }
        if (z == 10) {
          console.log(
            "Really found no images, may the user made tweets private?"
          );
          return;
        }
      }
      lastPage = await page.content();
    }
  } finally {
    await browser.close();
    console.log(lastPage);
  }
})()
  .catch(console.err)
  .then(() => process.exit(0));
