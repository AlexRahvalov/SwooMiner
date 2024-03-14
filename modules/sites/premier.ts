import Logger from '../logger';
import Utils from '../utils';
import {BrowserContext} from "puppeteer";

const {createCursor} = require("ghost-cursor");
const UserAgent = require('user-agents');
const config = require('../config.json');
const axios = require('axios');

export default class Premier {
  private readonly phone = '';

  private context: BrowserContext;
  private logger;

  constructor(context, phone) {
    this.context = context;
    this.phone = phone;

    this.logger = new Logger({
      service: 'premier',
      phone: phone
    });

    this.init().catch((err) => {
      this.logger.error(`error in premier module: ${err.message}`);
    });
  }

  async init() {
    const page = await this.context.newPage();
    page.on('response', async (response) => {
      try {
        if (!response.ok()) return this.logger.verbose(response.url());
        if (response.url() === 'https://auth.gid.ru/api/v1/sdk/web/users/score') {
          await this.captcha(response, page, cursor)
        }
      } catch (e: unknown) {
        this.logger.error(JSON.stringify(e));
      }
    });
    const cursor = createCursor(page);
    cursor.toggleRandomMove(true);
    await page.setExtraHTTPHeaders({
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
      const element: HTMLInputElement | null = document.querySelector('[data-qa-selector="phone"]');

      if (element) {
        element.value = '';
      }
    });

    await page.type('[data-qa-selector="phone"]', this.phone, {
      delay: Utils.getRndInteger(config.limits.keyboard.delay.min, config.limits.keyboard.delay.max)
    });

    await cursor.click('[data-qa-selector="continue-button"]');

    while (true) {
      await Utils.sleep(Utils.getRndInteger(config.limits.resend.min, config.limits.resend.max));

      try {
        await page.waitForSelector('.m-code-resend__button');
        await cursor.click('.m-code-resend__button');
      } catch (e) {
        this.logger.error('Cannot find the resend button.');
      }
    }
  }

  async captcha(response, page, cursor) {
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
      this.logger.error(captcha.data.errorDescription);
      status = false;
    }

    while (status) {
      await Utils.sleep(1000);

      const result = await axios.post('https://api.rucaptcha.com/getTaskResult', {
        "clientKey": config.anticaptcha.rucaptcha.secret,
        "taskId": captcha.data.taskId,
      });
      this.logger.info(result.data);

      if (result.data.status === "ready") {
        status = false;
        this.logger.info(result.data.solution);

        await cursor.click('#code');
        await page.type('#code', result.data.solution.text.trim().toLowerCase(), {delay: Utils.getRndInteger(config.limits.keyboard.delay.min, config.limits.keyboard.delay.max)});
        await cursor.click('[type="submit"]');

        await page.waitForResponse(async (res) => {
          try {
            this.logger.info(res.url());
            if (res.url() === 'https://auth.gid.ru/api/v1/sdk/web/actions/sign-in') {
              const resolve = JSON.parse(await res.text());

              this.logger.info(resolve.errors_description);
              if (resolve.errors_description === 'Неверный код') {
                await captcha(response, page, cursor)
              } else if (resolve.errors_description) {
                this.logger.error("Error: " + resolve.errors_description);
              }
            }

            return true;
          } catch (error) {
            return false;
          }
        });
      } else if (result.data.errorId > 0) {
        status = false;
        this.logger.error(result.data.errorDescription);
      }
    }
  }
}
