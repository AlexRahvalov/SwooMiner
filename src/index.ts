import Premier from './modules/sites/premier';
import AntiCaptcha from "./modules/anticaptcha";
import Config from "./modules/config";

global.config = new Config().get();
global.AntiCaptcha = new AntiCaptcha();

import Logger from './modules/logger';
const logger = new Logger({
  service: 'core'
});

const chromium = require('chrome-aws-lambda');
const {addExtra} = require('puppeteer-extra');
const puppeteer = addExtra(chromium.puppeteer);

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
      new Premier(context, phoneData.phone);
    }
  }
})();
