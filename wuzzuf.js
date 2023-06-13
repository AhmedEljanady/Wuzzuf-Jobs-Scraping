const { Cluster } = require("puppeteer-cluster");
const puppeteer = require("puppeteer");

// const fs = require("fs");

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

let urls = [];
let jobs = [];
const runClusters = async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 5,
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
    await page.goto(url);
    await page.waitForSelector(".css-1t5f0fr", { timeout: 5000 });
    let title,
      company,
      companyLogo,
      location,
      experience,
      postedDate,
      jobRequirements = "";

    //title
    const jobTitleElement = await page.$(".css-f9uh36");
    if (jobTitleElement) {
      title = await jobTitleElement.evaluate((element) => element.textContent);
      // console.log(title);
      // jobs.push({ jobTitle, url });
    } else {
      console.error("Job title element not found");
    }

    // job types
    const jobTypesElement = await page.$(".css-11rcwxl");
    const jobTypes = [];

    for (const jobType of await jobTypesElement.$$("a")) {
      let jobTypeName = await jobType.evaluate(
        (el) => el.querySelector(".css-ja0r8m").textContent
      );
      jobTypes.push(jobTypeName);
    }
    // console.log(jobTypes);

    //company details
    let companyDetails = await page.$eval(
      ".css-9geu3q",
      (el) => el.textContent
    );
    let index = companyDetails.indexOf("-");
    company = companyDetails.slice(0, index - 1);
    location = companyDetails.slice(index + 1);

    companyLogo = await page.$eval(".css-jb4x6y", (el) =>
      el.getAttribute("src")
    );
    // if (companyLogo.includes(";base64")) companyLogo = "";

    //job details
    experience = await page.$eval(".css-47jx3m", (el) => el.textContent);
    postedDate = await page.$eval(".css-182mrdn", (el) => el.textContent);

    jobRequirements = await page.$eval(".css-1t5f0fr", (el) => el.innerHTML);

    if (title) {
      jobs.push({
        title,
        jobTypes,
        company,
        location,
        companyLogo,
        experience,
        postedDate,
        jobRequirements,
        url,
      });
    }

    console.log(jobs);
    console.log(jobs.length);
  });
  for (const url of urls) {
    cluster.queue(url);
  }
  await cluster.idle();
  await cluster.close();
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });

  const page = await browser.newPage();
  await page.goto(
    "https://wuzzuf.net/search/jobs/?a=navbl&filters%5Bpost_date%5D%5B0%5D=within_24_hours&q=backend",
    { waitUntil: "domcontentloaded" }
  );

  // let i = 0;
  while (true) {
    //TODO: the error here is the element still present during loading
    // and that lead to the loop not stopped
    await sleep(3000); //Solve the error
    await page.waitForSelector(".css-1gatmva");
    const allJobs = await page.$$(".css-1gatmva");
    // let items = [];

    for (const job of allJobs) {
      let link = "";

      try {
        link = await page.evaluate(
          (el) => el.querySelector(".css-o171kl").getAttribute("href"),
          job
        );
        link = "https://wuzzuf.net" + link;
      } catch (err) {}
      // console.log(link);

      urls.push(link);
      // fs.appendFile("wuzzufJobs.csv", `${link} \n`, (err) => {
      //   console.log(`the err: ${err}`);
      // });
      console.log("url length: " + urls.length);
    }
    const nextButton = await page.$(
      'button svg path[d="M9.213 5L7.5 6.645 13.063 12 7.5 17.355 9.213 19l7.287-7z"]'
    );
    // console.log(i, nextButton);
    // i++;
    // console.log(i);

    if (nextButton) {
      await Promise.all([
        nextButton.click({ delay: 100 }), // Optional delay to simulate human-like clicking
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);
    } else {
      break;
    }
  }
  // console.log(urls);
  console.log(urls.length);
  runClusters();
  await browser.close();
})();

/****************************************** */

// const puppeteer = require("puppeteer");

// async function scrapeJobListings() {
//   // Create a new browser instance
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: false,
//     userDataDir: "./tmp",
//   });

//   // Navigate to the job search website
//   const page = await browser.newPage();
//   await page.goto(
//     "https://wuzzuf.net/search/jobs/?a=navbl&filters%5Bpost_date%5D%5B0%5D=within_1_week&q=backend",
//     { waitUntil: "load" }
//   );

//   // Get all of the job listings
//   const allJobs = await page.$$(".css-1gatmva");

//   // Create an array to store the job listings
//   const items = [];

//   // Loop through each job listing
//   for (const job of allJobs) {
//     await page.click(".css-o171kl");
//     await page.waitForSelector(".css-1t5f0fr");

//     // Get the title of the job
//     let title = await page.evaluate(
//       (el) => el.querySelector(".css-f9uh36").textContent,
//       job
//     );

//     // Get the job types element
//     const jobTypesElement = await page.querySelector(".css-11rcwxl");
//     // Create an array to store the job types
//     const jobTypes = [];
//     // Loop through the job types element
//     for (const jobType of jobTypesElement.querySelectorAll("a")) {
//       // Get the job type name
//       let jobTypeName = await jobType.evaluate(
//         (el) => el.querySelector(".css-ja0r8m").textContent,
//         jobType
//       );
//       // Add the job type to the array
//       jobTypes.push(jobTypeName);
//     }

//     // Get the company name
//     let companyDetails = await page.evaluate(
//       (el) => el.querySelector(".css-9geu3q").textContent,
//       job
//     );
//     let index = companyDetails.indexOf("-");
//     let company = companyDetails.slice(0, index - 1);
//     let location = companyDetails.slice(index + 1);

//     // Get the company logo
//     let companyLogo = await page.evaluate(
//       (el) => el.querySelector(".css-jb4x6y").getAttribute("src"),
//       job
//     );

//     // Get the posted date of the job
//     let postedDate = await page.evaluate(
//       (el) => el.querySelector(".css-182mrdn").textContent,
//       job
//     );

//     // Get the description of the job
//     let experience = await page.evaluate(
//       (el) => el.querySelector(".css-47jx3m").textContent,
//       job
//     );

//     // Get the link to the job listing
//     let link = await page.evaluate(
//       (el) => el.querySelector(".css-o171kl").getAttribute("href"),
//       job
//     );
//     link = "https://wuzzuf.net" + link;

//     // Get the job requirements
//     let jobRequirements = await page.evaluate(
//       (el) => el.querySelector(".css-1t5f0fr").innerHTML,
//       job
//     );

//     // Add the job listing to the array
//     items.push({
//       title,
//       company,
//       companyLogo,
//       location,
//       experience,
//       postedDate,
//       jobRequirements,
//       link,
//     });
//   }

//   // Close the browser instance
//   await browser.close();

//   // Return the array of job listings
//   return items;
// }

// // Call the scrapeJobListings() function and print the results
// const items = await scrapeJobListings();
// console.log(items);

// const puppeteer = require("puppeteer");

// const sleep = (milliseconds) => {
//   return new Promise((resolve) => setTimeout(resolve, milliseconds));
// };

// async function scrapeJobListings() {
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: false,
//     userDataDir: "./tmp",
//   });

//   const page = await browser.newPage();
//   await page.goto(
//     "https://wuzzuf.net/search/jobs/?a=navbl&filters%5Bpost_date%5D%5B0%5D=within_24_hours&q=backend",
//     { waitUntil: "load" }
//   );

//   const allJobs = await page.$$(".css-1gatmva");
//   console.log(allJobs.length);
//   const items = [];

//   for (const job of allJobs) {
//     await page.click(".css-o171kl");

//     //TODO: error here
//     //copy jobs url to [] and open then at parallel way
//     // try {
//     //   await page.waitForNavigation({ timeout: 10000 });
//     // } catch (err) {
//     //   console.log(err);
//     // }

//     // await sleep(5000);

//     // await page.waitForSelector(".css-1t5f0fr", { timeout: 5000 });

//     let title = await page.evaluate((el) => el, job);
//     console.log(title);

//     //   const jobTitleElement = await page.$(".css-o171kl");
//     //   if (jobTitleElement) {
//     //     const jobTitle = await jobTitleElement.evaluate(
//     //       (element) => element.textContent
//     //     );
//     //     console.log(jobTitle);
//     //   } else {
//     //     console.error("Job title element not found");
//     //   }

//     //   const jobTypesElement = await job.$(".css-11rcwxl");
//     //   const jobTypes = [];

//     //   for (const jobType of await jobTypesElement.$$("a")) {
//     //     let jobTypeName = await jobType.evaluate(
//     //       (el) => el.querySelector(".css-ja0r8m").textContent
//     //     );
//     //     jobTypes.push(jobTypeName);
//     //   }
//     //   console.log(jobTypes);

//     //   let companyDetails = await job.$eval(".css-9geu3q", (el) => el.textContent);
//     //   let index = companyDetails.indexOf("-");
//     //   let company = companyDetails.slice(0, index - 1);
//     //   let location = companyDetails.slice(index + 1);

//     //   let companyLogo = await job.$eval(".css-jb4x6y", (el) =>
//     //     el.getAttribute("src")
//     //   );

//     //   let postedDate = await job.$eval(".css-182mrdn", (el) => el.textContent);

//     //   let experience = await job.$eval(".css-47jx3m", (el) => el.textContent);

//     //   let link = await job.$eval(
//     //     ".css-o171kl",
//     //     (el) => "https://wuzzuf.net" + el.getAttribute("href")
//     //   );

//     //   let jobRequirements = await job.$eval(".css-1t5f0fr", (el) => el.innerHTML);

//     //   items.push({
//     //     title,
//     //     company,
//     //     companyLogo,
//     //     location,
//     //     experience,
//     //     postedDate,
//     //     jobRequirements,
//     //     link,
//     //   });
//     // }

//     await browser.close();

//     return items;
//   }
// }
// scrapeJobListings().then((items) => {
//   console.log(items);
// });
