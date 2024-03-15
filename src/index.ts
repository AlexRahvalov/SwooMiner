import Premier from './modules/sites/premier';
import AntiCaptcha from "./modules/anticaptcha";
import Config from "./modules/config";

global.config = new Config().get();
global.AntiCaptcha = new AntiCaptcha();

import Logger from './modules/logger';
import Tinkoff from "./modules/sites/tinkoff";

const logger = new Logger({
  service: 'core'
});

const chromium = require('chrome-aws-lambda');
const {addExtra} = require('puppeteer-extra');
const puppeteer = addExtra(chromium.puppeteer);
const AdmZip = require("adm-zip");

(async () => {
  const StealthPlugin = require("puppeteer-extra-plugin-stealth");
  const stealth = StealthPlugin();

  stealth.enabledEvasions.delete('accept-language');
  puppeteer.use(stealth)

  if (global.config.plugins.adblock) {
    const {DEFAULT_INTERCEPT_RESOLUTION_PRIORITY} = require('puppeteer');

    const adblock = require('puppeteer-extra-plugin-adblocker');
    puppeteer.use(
      adblock({
        interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
        blockTrackers: false,
        useCache: true,
        blockTrackersAndAnnoyances: false
      })
    );
  }

  const browser = await puppeteer.launch({headless: global.config.browser.hide, devtools: global.config.browser.devtools});
  const context = await browser.createIncognitoBrowserContext();

  for (let idx = 0; idx < global.config.phones.length; idx++) {
    const phoneData = global.config.phones[idx];

    if (phoneData.active) {
      continue;
    }

    const sites: (typeof Premier | typeof Tinkoff)[] = [];

    if (global.config.sites.premier) {
      sites.push(Premier);
    }

    if (global.config.sites.tinkoff) {
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
