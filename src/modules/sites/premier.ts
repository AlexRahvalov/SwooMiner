import Logger from '../logger';
import Utils from '../utils';
import {BrowserContext, Page} from "puppeteer";
import * as fs from "fs";

const {createCursor} = require("ghost-cursor");
const UserAgent = require('user-agents');
const AdmZip = require("adm-zip");

export default class Premier {
  private readonly phone = '';

  private context: BrowserContext;
  private page: Page | null = null;

  private logger;

  constructor(context, phone) {
    this.context = context;
    this.phone = phone;

    this.logger = new Logger({
      service: 'premier',
      phone: phone
    });

    this.init().catch(async (err) => {
      this.logger.error(`Ошибка во время навигации по сайту. Создание отчёта об ошибке`);

      const screenshot = await this.page?.screenshot({
        fullPage: true,
        type: 'jpeg',
        quality: 100
      });

      const zip = new AdmZip();
      await zip.addFile('error.bin', Buffer.from(JSON.stringify(err), 'utf8'));
      if (screenshot) {
        await zip.addFile('img.jpg', screenshot);
      }
      await zip.addLocalFolderPromise('./logs', {
        zipPath: '/logs'
      });
      zip.writeZip("./report.zip");

      this.logger.error(`Отчёт создан: report.zip. Отправьте его разработчику для исправления ошибки!`);

      this.page?.close();
    });
  }

  async init() {
    this.page = await this.context.newPage();
    this.page.on('response', async (response) => {
      try {
        if (!response.ok()) return this.logger.debug(`Запрос ${response.url()} неуспешен`);
        if (response.url() === 'https://auth.gid.ru/api/v1/sdk/web/users/score') {
          await this.captcha(response, this.page, cursor)
        }
      } catch { }
    });
    const cursor = createCursor(this.page);
    cursor.toggleRandomMove(true);
    await this.page.setExtraHTTPHeaders({
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6',
      'DNT': '1'
    });

    await this.page.setUserAgent(new UserAgent({
      deviceCategory: 'desktop'
    }).toString());

    await this.page.goto('https://premier.one/', {waitUntil: "domcontentloaded"});

    await this.page.waitForSelector('.a-button.a-button--secondary.a-button--small.a-button--left.a-button.w-header__button-login.w-header__buttons-item');
    await cursor.click('.a-button.a-button--secondary.a-button--small.a-button--left.a-button.w-header__button-login.w-header__buttons-item');

    await this.page.waitForSelector('[data-qa-selector="phone"]');

    await this.page.evaluate(() => {
      const element: HTMLInputElement | null = document.querySelector('[data-qa-selector="phone"]');

      if (element) {
        element.value = '';
      }
    });

    await this.page.type('[data-qa-selector="phone"]', this.phone, {
      delay: Utils.getRndInteger(global.config.limits.keyboard.delay.min, global.config.limits.keyboard.delay.max)
    });

    await cursor.click('[data-qa-selector="continue-button"]');

    try {
      await this.page.waitForSelector('.a-pincode-input__input', {
        timeout: Number(global.config.limits.confirm.timeout)
      });
    } catch {
      this.logger.error(`Страница с вводом кода не была открыта, возможно словили ошибку`);
    }

    while (!this.page.isClosed()) {
      let delay = Utils.getRndInteger(global.config.limits.resend.min, global.config.limits.resend.max);

      const error = await this.page.evaluate(() => {
        const element = document.querySelectorAll('[data-qa-selector="error"]')[1];

        if (element) {
          return element.textContent;
        }

        return null;
      });

      if (error) {
        this.logger.error(`Сервис выдал ошибку: ${error}`);

        const banMatch = error.match(/Вы уже запросили код\. Попробуйте снова через: (\d+)/);

        if (banMatch) {
          delay = (Number(banMatch[1]) + 2) * 1000;
          this.logger.error(`Ставим паузу на ${delay} (block)`);
        }
      }

      this.logger.info(`Отправили сообщение, ждём перед повторной отправкой ${Number(delay / 1000)} секунд`);
      await Utils.sleep(delay);

      try {
        await this.page.waitForSelector('.m-code-resend__button');
        await cursor.click('.m-code-resend__button');
      } catch (e) {
        this.logger.error('Не могу найти кнопку переотправки сообщения');
      }
    }
  }

  async captcha(response, page, cursor) {
    if (!global.AntiCaptcha.hasActiveProviders()) {
      this.logger.error(`Нет активных провайдеров анти-капчти, введите капчу вручную`);

      return;
    }

    const data = JSON.parse(await response.text());
    const captcha_id = data.captcha_id;
    const image = data.captcha_image_base64;

    const solve = await global.AntiCaptcha.process(image);
    if (solve === false) {
      this.logger.error(`Нет ответа от сервиса анти-капчи, пробуем снова...`);

      return this.captcha(response, page, cursor);
    }

    this.logger.verbose(`Получен ответ от сервиса анти-капчи: ${JSON.stringify(solve)}`);

    await cursor.click('#code');
    await page.type('#code', solve.text, {delay: Utils.getRndInteger(global.config.limits.keyboard.delay.min, global.config.limits.keyboard.delay.max)});
    await cursor.click('[type="submit"]');

    return await page.waitForResponse(async (res) => {
      try {
        if (res.url() === 'https://auth.gid.ru/api/v1/sdk/web/actions/sign-in') {
          const resolve = JSON.parse(await res.text());

          if (resolve.errors_description === 'Неверный код') {
            this.logger.error(`Неверная капча, пробуем снова...`);
            global.AntiCaptcha.report(solve.provider, solve.id);

            return this.captcha(response, page, cursor);
          } else if (resolve.errors_description) {
            this.logger.error("Error: " + resolve.errors_description);
          } else if (!resolve.errors_description) {
            this.logger.info(`Капча верная, отправляем информацию агрегатору`);
            global.AntiCaptcha.correct(solve.provider, solve.id);
          }
        }

        return true;
      } catch (error) {
        this.logger.error("Error: " + JSON.stringify(error));

        return false;
      }
    });
  }
}
