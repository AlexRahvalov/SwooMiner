import Logger from '../logger';
import {IAntiCaptcha} from "./IAntiCaptcha";

export default class BaseAntiCaptcha implements IAntiCaptcha {
  protected logger = new Logger({
    service: `anticaptcha_${BaseAntiCaptcha.name}`,
  });
  protected _secret;

  constructor(secret: string) {
    this.secret = secret;
  }

  set secret(value: string) {
    this._secret = value;
  }

  get secret() {
    return this._secret;
  }

  correct(id: number): void {
  }

  process(image: string): Promise<{ id: number; text: string } | false> {
    return Promise.resolve(false);
  }

  report(id: number): void {
  }
}
