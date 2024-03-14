import AntiCaptcha from "../modules/anticaptcha";

declare namespace NodeJS {
  interface Global {
    AntiCaptcha: AntiCaptcha;
  }
}
