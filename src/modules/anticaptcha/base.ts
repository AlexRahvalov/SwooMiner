import Logger from '../logger';

export default class BaseAntiCaptcha {
  protected logger = new Logger({
    service: `anticaptcha_${BaseAntiCaptcha.name}`,
  });
}
