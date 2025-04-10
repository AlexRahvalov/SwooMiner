import axios from 'axios';
import Utils from "../utils";
import BaseAntiCaptcha from "./base";

interface CaptchaResponse {
  taskId: number;
  errorIds?: number;
  errorDescription?: string;
}

interface CaptchaResultResponse {
  status: string;
  solution: {
    text: string;
  };
  errorId?: number;
  errorDescription?: string;
}

interface CaptchaSolution {
  id: number;
  text: string;
}

export default class RuCaptcha extends BaseAntiCaptcha {
  constructor(secret: string) {
    super(secret);
  }

  async process(image: string): Promise<CaptchaSolution | false> {
    const captcha = await axios.post<CaptchaResponse>('https://api.rucaptcha.com/createTask', {
      "clientKey": this.secret,
      "task": {
        "type": "ImageToTextTask",
        "body": image,
        "phrase": false,
        "case": true,
        "numeric": 4,
        "math": false,
        "minLength": 4,
        "maxLength": 5,
        "comment": "введите текст, который вы видите на изображении, в нижнем регистре"
      },
      "languagePool": "ru"
    });

    let status = true;
    if (captcha.data.errorIds && captcha.data.errorIds > 0) {
      this.logger.error(captcha.data.errorDescription || 'Неизвестная ошибка');
      status = false;
    }

    while (status) {
      await Utils.sleep(1000);

      const result = await axios.post<CaptchaResultResponse>('https://api.rucaptcha.com/getTaskResult', {
        "clientKey": this.secret,
        "taskId": captcha.data.taskId,
      });
      this.logger.info(JSON.stringify(result.data));

      if (result.data.status === "ready") {
        status = false;
        this.logger.info(JSON.stringify(result.data.solution));

        return {
          id: Number(captcha.data.taskId),
          text: result.data.solution.text.trim().toLowerCase(),
        };
      } else if (result.data.errorId && result.data.errorId > 0) {
        status = false;
        this.logger.error(result.data.errorDescription || 'Неизвестная ошибка');
      }
    }

    return false;
  }

  async report(id: number): Promise<void> {
    await axios.post('https://api.rucaptcha.com/reportIncorrect', {
      "clientKey": this.secret,
      "taskId": id,
    });
  }

  async correct(id: number): Promise<void> {
    await axios.post('https://api.rucaptcha.com/reportCorrect', {
      "clientKey": this.secret,
      "taskId": id,
    });
  }
}
