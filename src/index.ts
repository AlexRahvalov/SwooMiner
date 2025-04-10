import Premier from './modules/sites/premier';
import AntiCaptcha from "./modules/anticaptcha";
import Config from "./modules/config";
import Logger from './modules/logger';
import Tinkoff from "./modules/sites/tinkoff";
// @ts-ignore
import puppeteer from 'puppeteer';
// @ts-ignore
import { addExtra } from 'puppeteer-extra';
// @ts-ignore
import AdmZip from "adm-zip";
// @ts-ignore
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// @ts-ignore
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';

// Инициализируем глобальные объекты
// @ts-ignore для игнорирования проблем с типами в Bun
globalThis.config = new Config().get();
// @ts-ignore для игнорирования проблем с типами в Bun
globalThis.AntiCaptcha = new AntiCaptcha();

const logger = new Logger({
  service: 'core'
});

const puppeteerExtra = addExtra(puppeteer);

(async () => {
  const stealth = StealthPlugin();

  stealth.enabledEvasions.delete('accept-language');
  puppeteerExtra.use(stealth)

  if (globalThis.config.plugins.adblock) {
    // @ts-ignore
    const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = puppeteer;

    puppeteerExtra.use(
      AdblockerPlugin({
        interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
        blockTrackers: false,
        useCache: true,
        blockTrackersAndAnnoyances: false
      })
    );
  }

  const browser = await puppeteerExtra.launch({
    headless: globalThis.config.browser.hide ? 'new' : false, 
    devtools: globalThis.config.browser.devtools,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.createBrowserContext();

  for (let idx = 0; idx < globalThis.config.phones.length; idx++) {
    const phoneData = globalThis.config.phones[idx];

    if (!phoneData.active) {
      continue;
    }

    const sites: (typeof Premier | typeof Tinkoff)[] = [];

    if (globalThis.config.sites.premier) {
      sites.push(Premier);
    }

    if (globalThis.config.sites.tinkoff) {
      sites.push(Tinkoff);
    }

    sites.forEach((clazz) => {
      const instance = new clazz(context, phoneData.phone);

      instance.init().catch(async (err) => {
        instance.logger.error(`Ошибка во время навигации по сайту. Создание отчёта об ошибке`);

        const screenshot = await instance.page?.screenshot({
          fullPage: true,
          type: 'jpeg',
          quality: 100
        });

        const zip = new AdmZip();
        await zip.addFile('error.bin', Buffer.from(JSON.stringify(err), 'utf8'));
        if (screenshot) {
          await zip.addFile('img.jpg', screenshot);
        }
        await zip.addLocalFolderPromise('./logs', {
          zipPath: '/logs'
        });
        zip.writeZip("./report.zip");

        instance.logger.error(`Отчёт создан: report.zip. Отправьте его разработчику для исправления ошибки!`);

        instance.page?.close();
      });
    });
  }
})();
