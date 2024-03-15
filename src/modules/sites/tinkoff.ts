import BaseSite from "./base";
import Utils from "../utils";

export default class Tinkoff extends BaseSite {
  constructor(context, phone) {
    super(context, phone);
  }

  async init() {
    await super.init();

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

    try {
      await this.page.waitForSelector('[automation-id="otp-input"]', {
        timeout: Number(global.config.limits.confirm.timeout)
      });
    } catch {
      this.logger.error(`Страница с вводом кода не была открыта, возможно словили ошибку`);
    }

    setTimeout(this.resend, await this.getDelay());
  }

  async getDelay() {
    let delay = Utils.getRndInteger(global.config.limits.resend.min, global.config.limits.resend.max);

    const error = await this.page!.evaluate(() => {
      return '';
    });

    if (error) {
      // automation-id="left-time"
    }

    this.logger.info(`Отправили сообщение, ждём перед повторной отправкой ${Number(delay / 1000)} секунд`);
    await Utils.sleep(delay);

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
    }

    setTimeout(this.resend, await this.getDelay());
  }
}
