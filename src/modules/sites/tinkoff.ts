import BaseSite from "./base";

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
  }
}
