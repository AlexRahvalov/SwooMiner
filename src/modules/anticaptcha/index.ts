import Logger from '../logger';
import Utils from "../utils";

export default class AntiCaptcha {
  private logger = new Logger({
    service: 'anticaptcha',
  });
  private providers: typeof global.config.anticaptcha = {};
  private keys: string[];

  constructor() {
    Object.keys(global.config.anticaptcha).forEach((key) => {
      const provider = global.config.anticaptcha[key];
      if (provider.active && provider.secret.length > 0) {
        try {
          const provider = require(`./${key}.ts`);
          const clazz = new provider.default(provider.secret);

          this.providers[clazz.constructor.name] = clazz;
        } catch (e) {
          console.error(e)
          this.logger.error(`Ошибка во время импорта класса антикапчи "${key}": ${JSON.stringify(e)}`);
          process.exit(1);
        }
      }
    });

    this.keys = Object.keys(this.providers);
    this.logger.info(`Загружены следующие провайдеры анти-капчи: ${this.keys.join(', ')}`);
  }

  public hasActiveProviders() {
    return this.providers.length > 0;
  }

  public process(image: string) {
    const idx = Utils.getRndInteger(0, this.keys.length);
    const provider = this.keys[idx];

    return {
      ...this.providers[provider].process(image),
      provider: provider
    };
  }

  public report(provider: string, id: number) {
    return this.providers[provider].report(id);
  }

  public correct(provider: string, id: number) {
    return this.providers[provider].correct(id);
  }
}
