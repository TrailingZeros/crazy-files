#!/usr/bin/env node
const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");

const args = process.argv.slice(2);
const account = args[0];

function wait(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

function scanMatches(re, s) {
  return s.match(re);
}
function retry(func, cnt = 0) {
  return func().catch(r => {
    if (cnt > 3) {
      throw r;
    }
    return retry(func, ++cnt);
  });
}

// https://pbs.twimg.com/media/EEGVKodUcAAsVpl.png:small
const imgRegex = /(?:https?:)?\/\/pbs\.twimg\.com\/media\/([^.]+\.(?:png|jpe?g))(?:\:[^\" <>]+)?/;
const tweetRegex = /(?:https?:\/\/(?:www\.|m\.|mobile\.)?twitter\.com)?\/(?:[a-zA-Z0-9_]+)\/status\/(?:[0-9]+)/g;

(async () => {
  console.log("Opening");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"].concat(
      process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
    )
  });
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.goto(
      // https://twitter.com/search?q=from%3Ajapan%20filter%3Avideos&src=typd
      `https://twitter.com/${account}/media`,
      {
        timeout: 0
      }
    );
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
        ).catch(a => console.log(a.response));
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
      const waitTime = parseInt(5000 + Math.random() * 2000);
      console.error(`Waiting ${waitTime}ms`);
      await wait(waitTime);
    }
  } finally {
    await browser.close();
  }
})().catch(console.err);
