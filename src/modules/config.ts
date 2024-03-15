import Logger from './logger';
import * as fs from "fs";

export default class Config {
  private logger = new Logger({
    service: 'config'
  });
  private readonly config;
  private readonly version = 0.01;

  constructor() {
    try {
      this.config = require('../../config.json');

      this.migrate();

      const error = this.verify();
      if (error) {
        this.logger.error(`[Config] ${error}`);
        process.exit(1);
      }
    } catch {
      fs.copyFileSync('./config.example.json', './config.json');

      this.logger.error(`Новый файл конфигурации config.json был создан. Настойте его перед запуском скрипта`);
      process.exit(1);
    }
  }

  verify() {
    if (this.version > this.config.version) {
      return 'Невалидная версия';
    }

    if (this.config.limits.resend.min < 0 || this.config.limits.resend.max > Infinity) {
      return 'Неверные параметры времени повтора отправки смс';
    }

    if (this.config.limits.keyboard.delay.min < 0 || this.config.limits.keyboard.delay.max > Infinity) {
      return 'Невалидная конфигурация задержки печати';
    }

    if (this.config.limits.confirm.timeout < 0 || this.config.limits.confirm.timeout > Infinity) {
      return 'Невалидная конфигурация ожидания окна ввода кода';
    }

    if (typeof this.config.plugins.adblock !== 'boolean') {
      return 'adblock not bool';
    }

    if (typeof this.config.sites.premier !== 'boolean') {
      return 'sites.premier is not bool'
    }

    if (typeof this.config.sites.tinkoff !== 'boolean') {
      return 'sites.tinkoff is not bool'
    }

    return null;
  }

  get() {
    return this.config;
  }

  migrate() {
    switch(this.config.version) {

    }
  }
}
