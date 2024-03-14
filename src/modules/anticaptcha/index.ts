import Logger from '../logger';
import Utils from "../utils";
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

  public hasActiveProviders() {
    return this.providers.length > 0;
  }

  public process(image: string) {
    const providerId = Utils.getRndInteger(0, this.providers.length);

    return {
      ...this.providers[providerId].process(image),
      provider: providerId
    };
  }

  public report(provider: number, id: number) {
    return this.providers[provider].report(id);
  }

  public correct(provider: number, id: number) {
    return this.providers[provider].correct(id);
  }
}
