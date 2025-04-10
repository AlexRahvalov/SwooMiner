import Logger from '../logger';
import Utils from "../utils";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Получение текущей директории для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class AntiCaptcha {
  private logger = new Logger({
    service: 'anticaptcha',
  });
  private providers: any = {};
  private readonly keys: string[];

  constructor() {
    // Используем setTimeout, чтобы дать время для инициализации globalThis.config
    setTimeout(async () => {
      await this.initProviders();
    }, 0);
    
    this.keys = [];
  }
  
  private async initProviders() {
    if (!globalThis.config || !globalThis.config.anticaptcha) {
      this.logger.error('Конфигурация антикапчи не найдена');
      return;
    }
    
    for (const key of Object.keys(globalThis.config.anticaptcha)) {
      const provider = globalThis.config.anticaptcha[key];
      if (provider.active && provider.secret.length > 0) {
        try {
          // Построим корректный путь к файлу модуля
          const modulePath = join(__dirname, `./${key}.ts`);
          // Используем динамический импорт
          const module = await import(modulePath);
          const clazz = new module.default(provider.secret);

          this.providers[clazz.constructor.name] = clazz;
          this.keys.push(clazz.constructor.name);
        } catch (e) {
          console.error(e);
          this.logger.error(`Ошибка во время импорта класса антикапчи "${key}": ${JSON.stringify(e)}`);
          process.exit(1);
        }
      }
    }
    
    this.logger.info(`Загружены следующие провайдеры анти-капчи: ${this.keys.join(', ')}`);
  }

  public hasActiveProviders() {
    return this.keys.length > 0;
  }

  public process(image: string) {
    if (this.keys.length === 0) {
      this.logger.error('Нет активных провайдеров антикапчи');
      return false;
    }
    
    const idx = Utils.getRndInteger(0, this.keys.length);
    const provider = this.keys[idx];

    return {
      ...this.providers[provider].process(image),
      provider: provider
    };
  }

  public report(provider: string, id: number) {
    if (!this.providers[provider]) {
      this.logger.error(`Провайдер ${provider} не найден`);
      return;
    }
    return this.providers[provider].report(id);
  }

  public correct(provider: string, id: number) {
    if (!this.providers[provider]) {
      this.logger.error(`Провайдер ${provider} не найден`);
      return;
    }
    return this.providers[provider].correct(id);
  }
}
