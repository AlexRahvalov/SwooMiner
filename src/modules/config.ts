import Logger from './logger';

export default class Config {
  private logger = new Logger({
    service: 'config'
  });
  private readonly config;
  private readonly version = 0.01;

  constructor() {
    try {
      this.config = require('../../config');
      this.verify();
      this.migrate();
    } catch {
      this.logger.error(`Файл конфигурации config.json не найден`);
      process.exit(1);
    }
  }

  verify() {

  }

  get() {
    return this.config;
  }

  migrate() {
    switch(this.config.version) {

    }
  }
}
