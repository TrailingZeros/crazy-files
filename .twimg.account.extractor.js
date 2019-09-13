#!/usr/bin/env node
const socks = require("socks-proxy-agent");
const puppeteer = require("puppeteer");
const axios_ = require("axios");
const fs = require("fs");
const net = require("net");

const args = process.argv.slice(2);
const account = args[0];

const proxy = "socks5://localhost:9050";
const agent = socks(proxy);
const axios = axios_.create({ httpsAgent: agent, httpAgent: agent });

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

function reloadCircuit() {
  return new Promise(resolve => {
    const client = new net.Socket();
    client.connect(9051, "127.0.0.1", function() {
      client.write('AUTHENTICATE ""\nSIGNAL NEWNYM');
    });

    client.on("data", function() {
      client.destroy(); // kill client after server's response
    });

    client.on("close", function() {
      resolve();
    });
  });
}

async function randomWait() {
  const waitTime = parseInt(5000 + Math.random() * 2000);
  console.error(`Waiting ${waitTime}ms`);
  await wait(waitTime);
}
function showMyIp() {
  return axios({ url: "http://checkip.amazonaws.com/" })
    .then(a => a.data.trim())
    .then(console.log);
}

// https://pbs.twimg.com/media/EEGVKodUcAAsVpl.png:small
const imgRegex = /(?:https?:)?\/\/pbs\.twimg\.com\/media\/([^.]+\.(?:png|jpe?g))(?:\:[^\" <>]+)?/;

(async () => {
  await showMyIp();
  console.log("Opening");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", `--proxy-server=${proxy}`].concat(
      process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
    )
  });
  const url = `https://twitter.com/${account}/media`;
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.goto(url, { timeout: 0 });
    await page.setRequestInterception(true);
    let loadFlag = true;
    page.on("request", interceptedRequest => {
      const url = interceptedRequest.url();
      if (imgRegex.test(url)) {
        const imgName = url.match(imgRegex)[1];
        console.log(`Found: ${imgName}`);
        const filename = `twitter-${account}-${imgName}`;
        retry(() =>
          axios({ url, responseType: "arraybuffer" }).then(({ data }) =>
            fs.writeFileSync(filename, data)
          )
        ).catch(console.log);
        loadFlag = true;
      }
      interceptedRequest.continue();
    });
    let count = 0;
    while (loadFlag) {
      loadFlag = false;
      count++;
      console.error(`Processing #${count}`);
      await page.evaluate(_ => {
        window.scrollTo(0, document.body.scrollHeight);
        document.querySelectorAll("video,iframe").forEach(function(item) {
          item.remove();
        });
      });
      await randomWait();
      if (count == 1 && !loadFlag && proxy) {
        console.log("Trying to reload Tor circuits");
        while (loadFlag) {
          await reloadCircuit();
          await Promise.all(showMyIp(), page.goto(url, { timeout: 0 }));
          await randomWait();
        }
      }
    }
  } finally {
    await browser.close();
  }
})()
  .catch(console.err)
  .then(() => process.exit(0));
