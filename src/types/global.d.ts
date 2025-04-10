import AntiCaptcha from "../modules/anticaptcha";
import Config from "../modules/config";
import { Buffer } from "buffer";

// Объявление глобальных типов для Bun
declare global {
  var config: ReturnType<typeof Config.prototype.get>;
  var AntiCaptcha: AntiCaptcha;
  
  // Добавление Node.js совместимых типов
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
  
  var process: {
    exit: (code?: number) => never;
    env: NodeJS.ProcessEnv;
  };
  
  var Buffer: typeof Buffer;
  var require: (id: string) => any;
}

export {};
