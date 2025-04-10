import Logger from './logger';
import { readFileSync, writeFileSync, copyFileSync } from "fs";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Получение текущей директории для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

export default class Config {
  private logger = new Logger({
    service: 'config'
  });
  private readonly config;
  private readonly version = 0.02;

  constructor() {
    try {
      // Используем абсолютный путь для поиска файла
      const configPath = join(rootDir, 'config.json');
      this.config = JSON.parse(readFileSync(configPath, 'utf-8'));

      this.migrate();

      const error = this.verify();
      if (error) {
        this.logger.error(`[Config] ${error}`);
        process.exit(1);
      }
    } catch (e) {
      const examplePath = join(rootDir, 'config.example.json');
      const configPath = join(rootDir, 'config.json');
      copyFileSync(examplePath, configPath);

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
      return 'sites.premier is not bool';
    }

    if (typeof this.config.sites.tinkoff !== 'boolean') {
      return 'sites.tinkoff is not bool';
    }

    if (typeof this.config.browser.hide !== 'boolean') {
      return 'browser.hide is not bool';
    }

    if (typeof this.config.browser.devtools !== 'boolean') {
      return 'browser.devtools is not bool';
    }

    return null;
  }

  get() {
    return this.config;
  }

  migrate() {
    if (this.version === this.config.version) {
      return;
    }

    this.logger.info(`Миграция конфигурации ${this.config.version} > ${this.version}`);

    if (this.config.version < 0.02) {
      this.config.browser = {
        hide: false,
        devtools: false
      };
    }

    this.config.version = this.version;

    const configPath = join(rootDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  }
}
