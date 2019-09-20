#!/usr/bin/env node
const puppeteer = require("puppeteer");

const args = process.argv.slice(2);
const account = args[0];

function wait(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

function scanMatches(re, s) {
  return s.match(re);
}

const imgRegex = /(https?:\/\/pbs\.twimg\.com\/media\/[^\" <>]+)/g;
const tweetRegex = /(?:https?:\/\/(?:www\.|m\.|mobile\.)?twitter\.com)?\/(?:[a-zA-Z0-9_]+)\/status\/(?:[0-9]+)/g;

(async () => {
  console.log("Opening");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"].concat(
      process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
    )
  });
  let lastPage = "";
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
      const waitTime = parseInt(5000 + Math.random() * 2000);
      console.error(`Waiting ${waitTime}ms`);
      await wait(waitTime);
      loadFlag = count < 5 || process.env.CI;
      lastPage = await page.content();
    }
  } finally {
    await browser.close();
    console.log(lastPage);
  }
})()
  .catch(console.err)
  .then(() => process.exit(0));
