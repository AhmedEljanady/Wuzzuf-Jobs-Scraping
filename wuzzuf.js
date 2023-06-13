const { Cluster } = require("puppeteer-cluster");
const puppeteer = require("puppeteer");
// const fs = require("fs");

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

let urls = [];

const scrapeJobLinks = async (page) => {
  while (true) {
    await sleep(3000);
    await page.waitForSelector(".css-1gatmva");
    const allJobs = await page.$$(".css-1gatmva");

    for (const job of allJobs) {
      let link = "";
      try {
        link = await page.evaluate(
          (el) => el.querySelector(".css-o171kl").getAttribute("href"),
          job
        );
        link = "https://wuzzuf.net" + link;
      } catch (err) {}

      urls.push(link);
      console.log("url length: " + urls.length);
    }

    const nextButton = await page.$(
      'button svg path[d="M9.213 5L7.5 6.645 13.063 12 7.5 17.355 9.213 19l7.287-7z"]'
    );

    if (nextButton) {
      await Promise.all([
        nextButton.click({ delay: 100 }), // Optional delay to simulate human-like clicking
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    } else {
      break;
    }
  }
};

const scrapeJobDetails = async (page, url) => {
  await page.goto(url);
  await page.waitForSelector(".css-1t5f0fr", { timeout: 5000 });

  let title,
    company,
    companyLogo,
    location,
    experience,
    postedDate,
    jobRequirements = "";

  const jobTitleElement = await page.$(".css-f9uh36");
  if (jobTitleElement) {
    title = await jobTitleElement.evaluate((element) => element.textContent);
  } else {
    console.error("Job title element not found");
  }

  const jobTypesElement = await page.$(".css-11rcwxl");
  const jobTypes = [];
  for (const jobType of await jobTypesElement.$$("a")) {
    let jobTypeName = await jobType.evaluate(
      (el) => el.querySelector(".css-ja0r8m").textContent
    );
    jobTypes.push(jobTypeName);
  }

  let companyDetails = await page.$eval(".css-9geu3q", (el) => el.textContent);
  let index = companyDetails.indexOf("-");
  company = companyDetails.slice(0, index - 1);
  location = companyDetails.slice(index + 1);

  companyLogo = await page.$eval(".css-jb4x6y", (el) => el.getAttribute("src"));

  experience = await page.$eval(".css-47jx3m", (el) => el.textContent);
  postedDate = await page.$eval(".css-182mrdn", (el) => el.textContent);

  jobRequirements = await page.$eval(".css-1t5f0fr", (el) => el.innerHTML);

  return {
    title,
    jobTypes,
    company,
    location,
    companyLogo,
    experience,
    postedDate,
    jobRequirements,
    url,
  };
};

const runClusters = async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 10,
    // monitor: true,
    puppeteerOptions: {
      headless: false,
      defaultViewport: false,
      userDataDir: "./tmp",
      timeout: 60000,
    },
  });

  cluster.on("taskerror", (err, data) => {
    console.log(`err ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: url }) => {
    const jobDetails = await scrapeJobDetails(page, url);
    console.log(jobDetails);
  });

  for (const url of urls) {
    cluster.queue(url);
  }

  await cluster.idle();
  await cluster.close();
};

(async () => {
  const wuzzufURL =
    "https://wuzzuf.net/search/jobs/?a=navbl&filters%5Bpost_date%5D%5B0%5D=within_24_hours&q=backend";

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });

  const page = await browser.newPage();
  //TODO: Take this url from user
  await page.goto(wuzzufURL, { waitUntil: "domcontentloaded" });

  await scrapeJobLinks(page);
  console.log(urls.length);

  runClusters();

  await browser.close();
})();
