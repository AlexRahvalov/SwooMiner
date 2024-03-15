import AntiCaptcha from "../modules/anticaptcha";
import Config from "../modules/config";

declare namespace NodeJS {
  interface Global {
    AntiCaptcha: AntiCaptcha;
    config: typeof Config.get;
  }
}
