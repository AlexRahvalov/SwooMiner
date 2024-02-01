const chromium = require('chrome-aws-lambda');
const {addExtra} = require('puppeteer-extra');
const puppeteer = addExtra(chromium.puppeteer);
const UserAgent = require('user-agents');
const {createCursor} = require("ghost-cursor");
const axios = require('axios');


(async () => {
  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function captcha(response, page, cursor) {
    const data = JSON.parse(await response.text());
    const captcha_id = data.captcha_id;
    const image = data.captcha_image_base64;
    const captcha = await axios.post('https://api.rucaptcha.com/createTask', {
      "clientKey": "Your rucaptcha API key",  //  Paste your API key from the rucaptcha.com website
      "task": {
        "type": "ImageToTextTask",
        "body": image,
        "phrase": false,
        "case": true,
        "numeric": 4,
        "math": false,
        "minLength": 4,
        "maxLength": 5,
        "comment": "введите текст, который вы видите на изображении, в нижнем регистре"
      },
      "languagePool": "ru"
    })
    let status = true;
    if (captcha.data.errorIds > 0) {
      console.error(captcha.data.errorDescription);
      status = false;
    }

    while (status) {
      await sleep(1000)
      const result = await axios.post('https://api.rucaptcha.com/getTaskResult', {
        "clientKey": "Your rucaptcha API key",  //  Paste your API key from the rucaptcha.com website
        "taskId": captcha.data.taskId,
      })
      console.log(result.data)
      if (result.data.status === "processing") {
      } else if (result.data.status === "ready") {
        status = false;
        console.log(result.data.solution);
        await cursor.click('#code');
        await page.type('#code', result.data.solution.text.trim().toLowerCase(), {delay: getRndInteger(200, 500)});
        await cursor.click('[type="submit"]');
        await page.waitForResponse(async (res) => {
          try {
            console.log(res.url());
            if (res.url() === 'https://auth.gid.ru/api/v1/sdk/web/actions/sign-in') {
              console.log(await res.text());
              const resolve = JSON.parse(await res.text());
              
              if (resolve.errors_description === 'Неверный код') {
                axios.post('https://api.rucaptcha.com/reportIncorrect', {
                  "clientKey": "Your rucaptcha API key",  //  Paste your API key from the rucaptcha.com website
                  "taskId": captcha.data.taskId,
                });
                await captcha(response, page, cursor)
                console.log(resolve.errors_description)
              } else if (resolve.errors_description) {
                console.error("Error: " + resolve.errors_description);
              }
            }
            return true;
          } catch (error) {
            return false;
          }
        });
      } else if (result.data.errorId > 0) {
        status = false;
        console.error(result.data.errorDescription);
      }
    }
  }

  const StealthPlugin = require("puppeteer-extra-plugin-stealth");
  const stealth = StealthPlugin()
  stealth.enabledEvasions.delete('accept-language')
  puppeteer.use(stealth)

  const {DEFAULT_INTERCEPT_RESOLUTION_PRIORITY} = require('puppeteer')
  const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
  puppeteer.use(
    AdblockerPlugin({
      interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
      blockTrackers: false,
      useCache: true,
      blockTrackersAndAnnoyances: false
    })
  )

  /*const browser = await puppeteer.launch({headless: false, devtools: true, args: [`
  --proxy-server=${process.env.PROXY_TYPE}://${process.env.PROXY_IP}:${process.env.PROXY_PORT},`
]});*/
  const browser = await puppeteer.launch({headless: false, devtools: true});
  const context = await browser.createIncognitoBrowserContext()

  async function sendsms(phone) {
    const page = await context.newPage();
    //await page.authenticate({username:process.env.PROXY_LOGIN, password:process.env.PROXY_PASSWORD});
    page.on('response', async (response) => {
      try {
        if (!response.ok()) return console.log(response.url());
        if (response.url() === 'https://auth.gid.ru/api/v1/sdk/web/users/score') {
          await captcha(response, page, cursor)
        }
      } catch (e) {
        //console.error(e);
      }

    });
    const cursor = createCursor(page);
    cursor.toggleRandomMove(true);
    await page.setExtraHTTPHeaders({
      //'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6',
      'DNT': '1'
    });

    await page.setUserAgent(new UserAgent({
      deviceCategory: 'desktop'
    }).toString());
    await page.goto('https://premier.one/', {waitUntil: "domcontentloaded"});
    await page.waitForSelector('.a-button.a-button--secondary.a-button--small.a-button--left.a-button.w-header__button-login.w-header__buttons-item');
    await cursor.click('.a-button.a-button--secondary.a-button--small.a-button--left.a-button.w-header__button-login.w-header__buttons-item');
    await page.waitForSelector('[data-qa-selector="phone"]');
    await page.evaluate(() => {
      document.querySelector('[data-qa-selector="phone"]').value = '';
    })
    await page.type('[data-qa-selector="phone"]', phone, {
      delay: getRndInteger(200, 500)
    });
    await cursor.click('[data-qa-selector="continue-button"]');
    while (true) {
      await new Promise(r => setTimeout(r, getRndInteger(60 * 1000, 90 * 1000))); //  Limit the frequency of sending SMS messages from every 60 seconds to every 90 seconds. 
      try {
        await page.waitForSelector('.m-code-resend__button');
        await cursor.click('.m-code-resend__button');
      } catch (e) {
        console.error('Cannot find the resend button.');
      }
    }
  }
  sendsms('Your phone number');
})();
