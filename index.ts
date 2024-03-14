const config = require('./config.json');

const chromium = require('chrome-aws-lambda');
const {addExtra} = require('puppeteer-extra');
const puppeteer = addExtra(chromium.puppeteer);

import Premier from './modules/sites/premier';
import Logger from './modules/logger';

const logger = new Logger({
  service: 'core'
});

(async () => {
  const StealthPlugin = require("puppeteer-extra-plugin-stealth");
  const stealth = StealthPlugin()

  stealth.enabledEvasions.delete('accept-language')
  puppeteer.use(stealth)

  if (config.plugins.adblock) {
    const {DEFAULT_INTERCEPT_RESOLUTION_PRIORITY} = require('puppeteer');

    const adblock = require('puppeteer-extra-plugin-adblocker')
    puppeteer.use(
      adblock({
        interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
        blockTrackers: false,
        useCache: true,
        blockTrackersAndAnnoyances: false
      })
    );
  }

  const browser = await puppeteer.launch({headless: false, devtools: true});
  const context = await browser.createIncognitoBrowserContext()

  for (let idx = 0; idx < config.phones.length; idx++) {
    const phoneData = config.phones[idx];

    if (phoneData.active) {
      new Premier(context, phoneData.phone);
    }
  }
})();
