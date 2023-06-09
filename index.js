const puppeteer = require("puppeteer");
// const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });

  const page = await browser.newPage();
  await page.goto(
    "https://wuzzuf.net/search/jobs/?a=navbl&filters%5Bpost_date%5D%5B0%5D=within_1_week&q=backend",
    { waitUntil: "load" }
  );

  const allJobs = await page.$$(".css-1gatmva");
  let items = [];

  // console.log("x: " + allJobs.length);
  for (const job of allJobs) {
    let title,
      company,
      companyLogo,
      location,
      postedDate,
      description,
      link = "";
    // let jobRequirements = "";

    try {
      title = await page.evaluate(
        (el) => el.querySelector(".css-m604qf").textContent,
        job
      );
    } catch (err) {}
    // console.log(title);

    try {
      company = await page.evaluate(
        (el) => el.querySelector(".css-d7j1kk > a").textContent,
        job
      );
    } catch (err) {}
    // console.log(company);

    try {
      companyLogo = await page.evaluate(
        (el) => el.querySelector(".css-17095x3").getAttribute("src"),
        job
      );
    } catch (err) {}
    // console.log(companyLogo);

    try {
      location = await page.evaluate(
        (el) => el.querySelector(".css-5wys0k").textContent,
        job
      );
    } catch (err) {}
    // console.log(location);

    try {
      postedDate = await page.evaluate(
        (el) => el.querySelector(".css-4c4ojb").textContent,
        job
      );
    } catch (err) {}
    // console.log(postedDate);

    try {
      description = await page.evaluate(
        (el) => el.querySelector(".css-y4udm8").textContent,
        job
      );
    } catch (err) {}
    // console.log(description);

    try {
      link = await page.evaluate(
        (el) => el.querySelector(".css-o171kl").getAttribute("href"),
        job
      );
      link = "https://wuzzuf.net" + link;
    } catch (err) {}
    // console.log(link);

    // try {
    //   await page.click(".css-o171kl");
    //   await page.waitForSelector(".css-1t5f0fr");
    //   jobRequirements = await page.evaluate(
    //     (el) => el.querySelector(".css-1t5f0fr").innerHTML,
    //     job
    //   );
    // } catch (err) {}
    // console.log(1, jobRequirements);
    // await page.close();
    // try {
    //   await page.click(".css-o171kl");
    //   await page.waitForSelector(".css-1t5f0fr");

    //   const allReqs = await page.$$(".css-1t5f0fr > ul > li");
    //   for (const req of allReqs) {
    //     jobRequirements.push(req);
    //   }
    // } catch (err) {}

    if (title) {
      items.push({
        title,
        company,
        companyLogo,
        location,
        description,
        postedDate,
        // jobRequirements,
        link,
      });
    }
  }
  console.log(items);
  console.log(items.length);
  await browser.close();
})();
