import Logger from '../logger';
const config = require('../../../config.json');

export default class AntiCaptcha {
  private logger = new Logger({
    service: 'anticaptcha',
  });
  private providers: typeof config.anticaptcha = [];

  constructor() {
    Object.keys(config.anticaptcha).forEach((key) => {
      const provider = config.anticaptcha[key];
      if (provider.active && provider.secret.length > 0) {
        try {
          const clazz = require(`./${key}.ts`);
          this.providers.push(new clazz.default(provider.secret));
        } catch (e) {
          console.error(e)
          this.logger.error(`Ошибка во время импорта класса антикапчи "${key}": ${JSON.stringify(e)}`);
          process.exit(1);
        }
      }
    });

    this.logger.info(`Загружены следующие провайдеры анти-капчи: ${this.providers.map((el) => el.constructor.name).join(', ')}`);
  }

  public process(image: string) {
    return this.providers[0].process(image);
  }

  public report(id: number) {
    return this.providers[0].report(id);
  }

  public correct(id: number) {
    return this.providers[0].correct(id);
  }
}
