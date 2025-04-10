import {createCursor, GhostCursor} from "ghost-cursor";
import {ISIte} from "./ISIte";
import {BrowserContext, Page} from "puppeteer";
import Logger from "../logger";
import UserAgent from 'user-agents';

export default class BaseSite implements ISIte {
  readonly phone: string;

  context: BrowserContext;
  logger: Logger;

  page: Page | null = null;
  cursor: GhostCursor | null = null;

  constructor(context: BrowserContext, phone: string) {
    this.context = context;
    this.phone = phone;

    this.logger = new Logger({
      service: this.constructor.name,
      phone: phone
    });
  }

  async init() {
    this.page = await this.context.newPage();
    this.page.on('response', async (response) => {
      try {
        if (!response.ok()) return this.logger.debug(`Запрос ${response.url()} неуспешен`);
      } catch { }
    });
    this.cursor = createCursor(this.page);
    this.cursor.toggleRandomMove(true);
    await this.page.setExtraHTTPHeaders({
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6',
      'DNT': '1'
    });

    await this.page.setUserAgent(new UserAgent({
      deviceCategory: 'desktop'
    }).toString());
  }
}
