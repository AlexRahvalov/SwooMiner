const config = require('./config.json');

const chromium = require('chrome-aws-lambda');
const {addExtra} = require('puppeteer-extra');
const puppeteer = addExtra(chromium.puppeteer);
const UserAgent = require('user-agents');
const {createCursor} = require("ghost-cursor");
const axios = require('axios');
const winston = require('winston');


const logger = winston.createLogger({
  level: 'verbose',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: `logs/${(new Date()).toLocaleDateString()}.log` }),
  ],
});


logger.add(new winston.transports.Console({
  format: winston.format.simple(),
}));

function error(phone, message) {
	logger.error(message, {
		service: 'premier.one',
		phone
	});
}

function info(phone, message) {
	logger.info(message, {
		service: 'premier.one',
		phone
	});
}

function verbose(phone, message) {
	logger.verbose(message, {
		service: 'premier.one',
		phone
	});
}

(async () => {
  function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function captcha(response, page, cursor) {
	if (!config.anticaptcha.rucaptcha.active) {
	  return false;
	}
	
    const data = JSON.parse(await response.text());
    const captcha_id = data.captcha_id;
    const image = data.captcha_image_base64;
    
	const captcha = await axios.post('https://api.rucaptcha.com/createTask', {
      "clientKey": config.anticaptcha.rucaptcha.secret,
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
    });
	
    let status = true;
    if (captcha.data.errorIds > 0) {
      error(captcha.data.errorDescription);
      status = false;
    }

    while (status) {
      await sleep(1000);
	  
      const result = await axios.post('https://api.rucaptcha.com/getTaskResult', {
        "clientKey": config.anticaptcha.rucaptcha.secret,
        "taskId": captcha.data.taskId,
      });
      info(result.data);
	  
      if (result.data.status === "ready") {
        status = false;
        info(result.data.solution);
		
        await cursor.click('#code');
        await page.type('#code', result.data.solution.text.trim().toLowerCase(), {delay: getRndInteger(config.limits.keyboard.delay.min, config.limits.keyboard.delay.max)});
        await cursor.click('[type="submit"]');
        
		await page.waitForResponse(async (res) => {
          try {
            info(res.url());
            if (res.url() === 'https://auth.gid.ru/api/v1/sdk/web/actions/sign-in') {
              const resolve = JSON.parse(await res.text());
              
			  info(resolve.errors_description);
              if (resolve.errors_description === 'Неверный код') {
                await captcha(response, page, cursor)
              } else if (resolve.errors_description) {
                error("Error: " + resolve.errors_description);
              }
            }
			
            return true;
          } catch (error) {
            return false;
          }
        });
      } else if (result.data.errorId > 0) {
        status = false;
        error(result.data.errorDescription);
      }
    }
  }

  const StealthPlugin = require("puppeteer-extra-plugin-stealth");
  const stealth = StealthPlugin()
  stealth.enabledEvasions.delete('accept-language')
  puppeteer.use(stealth)
  
  if (config.plugins.adblock) {
	const {DEFAULT_INTERCEPT_RESOLUTION_PRIORITY} = require('puppeteer');
	const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
    puppeteer.use(
      AdblockerPlugin({
        interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
        blockTrackers: false,
        useCache: true,
        blockTrackersAndAnnoyances: false
      })
    );
  }

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
        if (!response.ok()) return verbose(response.url());
        if (response.url() === 'https://auth.gid.ru/api/v1/sdk/web/users/score') {
          await captcha(response, page, cursor)
        }
      } catch (e) {
        error(e);
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
      delay: getRndInteger(config.limits.keyboard.delay.min, config.limits.keyboard.delay.max)
    });
    
	await cursor.click('[data-qa-selector="continue-button"]');
    
	while (true) {
      await new Promise(r => setTimeout(r, getRndInteger(config.limits.resend.min, config.limits.resend.max)));
      try {
        await page.waitForSelector('.m-code-resend__button');
        await cursor.click('.m-code-resend__button');
      } catch (e) {
        error('Cannot find the resend button.');
      }
    }
  }
  
  for (let idx = 0; idx < config.phones.length; idx ++) {
    const phoneData = config.phones[idx];
	
	if (phoneData.active) {
      sendsms(phoneData.phone);
	}
  }
})();
