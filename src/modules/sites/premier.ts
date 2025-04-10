import Utils from '../utils';
import BaseSite from "./base";

export default class Premier extends BaseSite {
  constructor(context, phone) {
    super(context, phone);
  }

  async init() {
    await super.init();

    if (!this.page || !this.cursor) {
      return;
    }

    this.page.on('response', async (response) => {
      try {
        if (response.url() === 'https://auth.gid.ru/api/v1/sdk/web/users/score') {
          await this.captcha(response, this.page, this.cursor)
        }
      } catch { }
    });

    await this.page.goto('https://premier.one/');
    
    // Добавляем задержку 5 секунд перед взаимодействием с элементами страницы
    await Utils.sleep(5000);
    
    // Проверяем наличие модального окна и закрываем его с несколькими попытками
    const maxAttempts = 5; // Максимальное количество попыток
    const attemptDelay = 2000; // Задержка между попытками (2 секунды)
    let modalClosed = false;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (modalClosed) break;
      
      try {
        this.logger.info(`Попытка ${attempt}/${maxAttempts} обнаружения модального окна...`);
        
        // Используем несколько селекторов для большей надежности
        const modalSelectors = [
          '.m-modal-backdrop',
          '.m-modal',
          '[data-qa-selector="modal-window"]'
        ];
        
        let modalFound = false;
        for (const selector of modalSelectors) {
          const exists = await this.page.evaluate((sel) => {
            return !!document.querySelector(sel);
          }, selector);
          
          if (exists) {
            modalFound = true;
            this.logger.info(`Найдено модальное окно по селектору: ${selector}`);
            break;
          }
        }
        
        if (modalFound) {
          this.logger.info('Пытаемся закрыть модальное окно...');
          
          // Пробуем несколько вариантов закрытия окна
          const closeSelectors = [
            '[data-qa-selector="close-button"]',
            '.m-modal__content-close-btn',
            'button[aria-label="Закрыть"]'
          ];
          
          let closed = false;
          for (const selector of closeSelectors) {
            try {
              const buttonExists = await this.page.evaluate((sel) => {
                const button = document.querySelector(sel);
                return !!button && button.offsetParent !== null; // Проверяем, что кнопка видима
              }, selector);
              
              if (buttonExists) {
                await this.cursor.click(selector);
                await Utils.sleep(1000); // Ждем немного после клика
                
                // Проверяем, исчезло ли модальное окно
                const modalGone = await this.page.evaluate(() => {
                  return !document.querySelector('.m-modal-backdrop');
                });
                
                if (modalGone) {
                  this.logger.info(`Модальное окно успешно закрыто с помощью селектора: ${selector}`);
                  closed = true;
                  modalClosed = true;
                  break;
                }
              }
            } catch (e) {
              this.logger.error(`Ошибка при попытке клика по селектору ${selector}: ${e}`);
            }
          }
          
          if (!closed) {
            // Если не удалось закрыть через кнопку, пробуем JavaScript клик
            this.logger.info('Пытаемся закрыть модальное окно через JavaScript...');
            try {
              await this.page.evaluate(() => {
                const closeButton = document.querySelector('[data-qa-selector="close-button"]');
                if (closeButton) {
                  (closeButton as HTMLElement).click();
                }
              });
              await Utils.sleep(1000);
              
              // Проверяем, исчезло ли модальное окно
              const modalGone = await this.page.evaluate(() => {
                return !document.querySelector('.m-modal-backdrop');
              });
              
              if (modalGone) {
                this.logger.info(`Модальное окно успешно закрыто через JavaScript`);
                modalClosed = true;
              }
            } catch (e) {
              this.logger.error(`Ошибка при попытке закрыть окно через JavaScript: ${e}`);
            }
          }
        } else {
          this.logger.info(`Попытка ${attempt}: Модальное окно не обнаружено`);
          
          if (attempt === maxAttempts) {
            this.logger.info('Исчерпаны все попытки обнаружения модального окна, продолжаем работу');
          } else {
            this.logger.info(`Ожидаем ${attemptDelay}мс перед следующей попыткой...`);
            await Utils.sleep(attemptDelay);
          }
        }
      } catch (e) {
        this.logger.error(`Ошибка при попытке ${attempt} закрыть модальное окно: ${e}`);
        if (attempt < maxAttempts) {
          await Utils.sleep(attemptDelay);
        }
      }
    }

    // Продолжаем стандартный процесс входа
    await this.page.waitForSelector('[data-qa-selector="enter-login-button"]');
    await this.cursor.click('[data-qa-selector="enter-login-button"]');

    await this.page.waitForSelector('[data-qa-selector="phone"]');

    await this.page.evaluate(() => {
      const element: HTMLInputElement | null = document.querySelector('[data-qa-selector="phone"]');

      if (element) {
        element.value = '';
      }
    });

    await this.page.type('[data-qa-selector="phone"]', this.phone, {
      delay: Utils.getRndInteger(globalThis.config.limits.keyboard.delay.min, globalThis.config.limits.keyboard.delay.max)
    });

    await this.cursor.click('[data-qa-selector="continue-button"]');

    try {
      await this.page.waitForSelector('.a-pincode-input__input', {
        timeout: Number(globalThis.config.limits.confirm.timeout)
      });
    } catch {
      this.logger.error(`Страница с вводом кода не была открыта, возможно словили ошибку`);
    }

    setTimeout(this.resend.bind(this), await this.getDelay());
  }

  async captcha(response, page, cursor) {
    if (!globalThis.AntiCaptcha.hasActiveProviders()) {
      this.logger.error(`Нет активных провайдеров анти-капчти, введите капчу вручную`);

      return;
    }

    const data = JSON.parse(await response.text());
    const captcha_id = data.captcha_id;
    const image = data.captcha_image_base64;

    const solve = await globalThis.AntiCaptcha.process(image);
    if (solve === false) {
      this.logger.error(`Нет ответа от сервиса анти-капчи, пробуем снова...`);

      return this.captcha(response, page, cursor);
    }

    this.logger.verbose(`Получен ответ от сервиса анти-капчи: ${JSON.stringify(solve)}`);

    await cursor.click('#code');
    await page.type('#code', solve.text, {delay: Utils.getRndInteger(globalThis.config.limits.keyboard.delay.min, globalThis.config.limits.keyboard.delay.max)});
    await cursor.click('[type="submit"]');

    return await page.waitForResponse(async (res) => {
      try {
        if (res.url() === 'https://auth.gid.ru/api/v1/sdk/web/actions/sign-in') {
          const resolve = JSON.parse(await res.text());

          if (resolve.errors_description === 'Неверный код') {
            this.logger.error(`Неверная капча, пробуем снова...`);
            globalThis.AntiCaptcha.report(solve.provider, solve.id);

            return this.captcha(response, page, cursor);
          } else if (resolve.errors_description) {
            this.logger.error("Error: " + resolve.errors_description);
          } else if (!resolve.errors_description) {
            this.logger.info(`Капча верная, отправляем информацию агрегатору`);
            globalThis.AntiCaptcha.correct(solve.provider, solve.id);
          }
        }

        return true;
      } catch (error) {
        this.logger.error("Error: " + JSON.stringify(error));

        return false;
      }
    });
  }

  async getDelay() {
    let delay = Utils.getRndInteger(globalThis.config.limits.resend.min, globalThis.config.limits.resend.max);

    const error = await this.page!.evaluate(() => {
      const element = document.querySelectorAll('[data-qa-selector="error"]')[1];

      if (element) {
        return element.textContent;
      }

      return null;
    });

    if (error) {
      this.logger.error(`Сервис выдал ошибку: ${error}`);

      const banMatch = error.match(/Вы уже запросили код\. Попробуйте снова через: (\d+)/);

      if (banMatch) {
        delay = (Number(banMatch[1]) + 2) * 1000;
        this.logger.error(`Ставим паузу на ${delay} (block)`);
      }
    }

    // Проверяем наличие сообщения о времени до повторной отправки
    try {
      const resendText = await this.page!.evaluate(() => {
        const resendElement = document.querySelector('[data-qa-selector="code-resend-text"]');
        return resendElement ? resendElement.textContent : null;
      });

      if (resendText) {
        this.logger.info(`Найдено сообщение о времени повторной отправки: ${resendText}`);
        
        // Извлекаем число секунд из текста
        const secondsMatch = resendText.match(/через (\d+) сек/);
        if (secondsMatch) {
          const seconds = Number(secondsMatch[1]);
          
          // Добавляем случайное число из конфига + 2 секунды для надежности
          const randomDelay = Utils.getRndInteger(
            globalThis.config.limits.resend.min / 10, // Используем меньшие значения для этого случая
            globalThis.config.limits.resend.max / 10
          );
          delay = (seconds + 2) * 1000 + randomDelay;
          
          this.logger.info(`Установка задержки на основе времени из сообщения: ${seconds} сек + дополнительно ${randomDelay}мс`);
        }
      }
    } catch (e) {
      this.logger.error(`Ошибка при проверке времени повторной отправки: ${e}`);
    }

    this.logger.info(`Отправили сообщение, ждём перед повторной отправкой ${Number(delay / 1000)} секунд`);
    return delay;
  }

  async resend() {
    if (this.page?.isClosed()) {
      return;
    }

    try {
      await this.page!.waitForSelector('.m-code-resend__button');
      
      // Перед нажатием на кнопку проверяем, не заблокирована ли она
      const isButtonDisabled = await this.page!.evaluate(() => {
        const button = document.querySelector('.m-code-resend__button');
        return button ? button.classList.contains('m-code-resend__button--disabled') : true;
      });
      
      if (isButtonDisabled) {
        this.logger.info('Кнопка переотправки заблокирована, ожидаем...');
      } else {
        await this.cursor!.click('.m-code-resend__button');
        this.logger.info('Нажата кнопка повторной отправки кода');
      }
    } catch (e) {
      this.logger.error('Не могу найти кнопку переотправки сообщения');
    }

    setTimeout(this.resend.bind(this), await this.getDelay());
  }
}
