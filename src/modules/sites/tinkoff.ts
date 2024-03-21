import BaseSite from "./base";
import Utils from "../utils";

export default class Tinkoff extends BaseSite {
  constructor(context, phone) {
    super(context, phone);
  }

  async init() {
    await super.init();
  }

  async prepare() {
    if (!this.page || !this.cursor) {
      return;
    }

    await this.page.goto('https://www.tinkoff.ru/auth/login/', {waitUntil: "domcontentloaded"});

    await this.page.waitForSelector('[automation-id="phone-input"]');
    await this.cursor.click('[automation-id="phone-input"]');
    await this.page.type('[automation-id="phone-input"]', this.phone, {
      delay: Utils.getRndInteger(global.config.limits.keyboard.delay.min, global.config.limits.keyboard.delay.max)
    });

    await this.cursor.click('[automation-id="button-submit"]');

    this.resendTimeout = setTimeout(this.resend.bind(this), await this.getDelay());
  }

  async getDelay() {
    this.page?.waitForTimeout(5000);
    let delay = Utils.getRndInteger(global.config.limits.resend.min, global.config.limits.resend.max);

    const error = await this.page!.evaluate(() => {
      const element = document.querySelectorAll('[automation-id="server-error"]')[0];

      if (element) {
        return element.textContent;
      }

      return null;
    });

    if (!error) {
      try {
        await this.page!.waitForSelector('[automation-id="otp-input"]', {
          timeout: Number(global.config.limits.confirm.timeout)
        });

        this.logger.info(`Отправили сообщение, ждём перед повторной отправкой ${Number(delay / 1000)} секунд`);
      } catch {
        super.screenshot();
        this.logger.error(`Страница с вводом кода не была открыта, перезагружаем страницу`);

        if (this.resendTimeout) {
          clearTimeout(this.resendTimeout);
          this.resendTimeout = null;
        }

        await this.prepare();
        return;
      }
    } else {
      this.logger.error(`Сервис выдал ошибку: ${error}`);
    }

    return delay;
  }

  async resend() {
    if (this.page?.isClosed()) {
      return;
    }

    try {
      await this.page!.waitForSelector('[automation-id="resend-button"]');
      await this.cursor!.click('[automation-id="resend-button"]');
    } catch (e) {
      this.logger.error('Не могу найти кнопку переотправки сообщения');
      super.screenshot();
    }

    this.resendTimeout = setTimeout(this.resend.bind(this), await this.getDelay());
  }
}
