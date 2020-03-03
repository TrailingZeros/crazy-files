#!/usr/bin/env node
const socks = require("socks-proxy-agent");
const puppeteer = require("puppeteer");
const axios_ = require("axios");
const fs = require("fs");
const net = require("net");
const { spawn } = require("child_process");

const args = process.argv.slice(2);
const account = args[0];

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
  const waitTime = parseInt(8000 + Math.random() * 4000);
  console.error(`Waiting ${waitTime}ms`);
  await wait(waitTime);
}
function testConnection() {
  return axios({ url: "http://checkip.amazonaws.com/" }).then(a =>
    console.log("Connection is OK")
  );
}

// https://pbs.twimg.com/media/EEGVKodUcAAsVpl.png:small
const imgRegex = /(?:https?:)?\/\/pbs\.twimg\.com\/media\/([^.]+\.(?:png|jpe?g))(?:\:[^\" <>]+)?/;

(async () => {
  await testConnection();
  console.log("Opening");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"]
      .concat(
        process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
      )
      .concat(noTor ? [] : [`--proxy-server=${proxy}`])
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
    try {
      let count = 0;
      while (loadFlag) {
        loadFlag = false;
        count++;
        console.error(`Processing #${count}`);
<<<<<<< HEAD
=======
        await randomWait();
>>>>>>> bfca9748e98c704e82603213eabfba96afd18434
        await page.evaluate(_ => {
          window.scrollTo(0, document.body.scrollHeight);
          document.querySelectorAll("video,iframe").forEach(function(item) {
            item.remove();
          });
        });
        await randomWait();
<<<<<<< HEAD
=======
        await page.screenshot({path: `tmp/${account}-${Date.now()}.png`});
>>>>>>> bfca9748e98c704e82603213eabfba96afd18434
        if (count == 1 && !loadFlag && proxy && !noTor) {
          let z;
          console.log("Trying to reload Tor circuits");
          for (z = 0; z < 5 && !loadFlag; z++) {
            await Promise.all([reloadCircuit(), restartTorService()]);
            await retry(testConnection, -Infinity);
            await page.goto(url, { timeout: 0 });
            await randomWait();
<<<<<<< HEAD
=======
            await page.screenshot({path: `tmp/${account}-${Date.now()}.png`});
>>>>>>> bfca9748e98c704e82603213eabfba96afd18434
          }
          if (z == 10) {
            console.log(
              "Really found no images, may the user made tweets private?"
            );
            return;
          }
        }
      }
    } finally {
      const re = /status\/(\d+)/g;
      const content = await page.content();
      const ids = new Set();
      let m;
      do {
        m = re.exec(content);
        if (m) {
          ids.add(m[1]);
        }
      } while (m);
      for (let id of ids) {
        try {
          spawn("wget", [
            "-q",
            "-O",
            "/dev/null",
            "https://tweetsave.com/api.php?mode=save&tweet=" + id
          ]);
        } catch (e) {}
      }
    }
  } finally {
    await browser.close();
  }
})()
  .catch(console.err)
  .then(() => process.exit(0));
