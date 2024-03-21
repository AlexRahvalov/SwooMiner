import {BrowserContext, Page} from "puppeteer";
import Logger from "../logger";
import {GhostCursor} from "ghost-cursor";

export interface ISIte {
  readonly phone;

  context: BrowserContext;
  page: Page | null;
  cursor: GhostCursor | null;

  logger: Logger;

  init: (callback?) => void;
  captcha: (response, page, cursor) => boolean;
  prepare: () => void;
}
