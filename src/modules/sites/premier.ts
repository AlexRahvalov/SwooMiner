import Utils from '../utils';
import BaseSite from "./base";

export default class Premier extends BaseSite {
  constructor(context, phone) {
    super(context, phone);
  }

  async init() {
    await super.init();

    if (!this.page || !this.cursor) {
      return;
    }

    this.page.on('response', async (response) => {
      try {
        if (response.url() === 'https://auth.gid.ru/api/v1/sdk/web/users/score') {
          await this.captcha(response, this.page, this.cursor)
        }
      } catch { }
    });

    await this.page.goto('https://premier.one/', {waitUntil: "domcontentloaded"});

    await this.page.waitForSelector('.a-button.a-button--secondary.a-button--small.a-button--left.a-button.w-header__button-login.w-header__buttons-item');
    await this.cursor.click('.a-button.a-button--secondary.a-button--small.a-button--left.a-button.w-header__button-login.w-header__buttons-item');

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

    await this.cursor.click('[data-qa-selector="continue-button"]');

    try {
      await this.page.waitForSelector('.a-pincode-input__input', {
        timeout: Number(global.config.limits.confirm.timeout)
      });
    } catch {
      this.logger.error(`Страница с вводом кода не была открыта, возможно словили ошибку`);
    }

    setTimeout(this.resend.bind(this), await this.getDelay());
  }

  async captcha(response, page, cursor) {
    if (!super.captcha(response, page, cursor)) {
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

  async getDelay() {
    let delay = Utils.getRndInteger(global.config.limits.resend.min, global.config.limits.resend.max);

    const error = await this.page!.evaluate(() => {
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
    return delay;
  }

  async resend() {
    if (this.page?.isClosed()) {
      return;
    }

    try {
      await this.page!.waitForSelector('.m-code-resend__button');
      await this.cursor!.click('.m-code-resend__button');
    } catch (e) {
      this.logger.error('Не могу найти кнопку переотправки сообщения');
    }

    setTimeout(this.resend.bind(this), await this.getDelay());
  }
}
