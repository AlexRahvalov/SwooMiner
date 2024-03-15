const axios = require('axios');
import Utils from "../utils";
import BaseAntiCaptcha from "./base";

export default class RuCaptcha extends BaseAntiCaptcha {
  constructor(secret: string) {
    super(secret);
  }

  async process(image: string) {
    const captcha = await axios.post('https://api.rucaptcha.com/createTask', {
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
    if (captcha.data.errorIds > 0) {
      this.logger.error(captcha.data.errorDescription);
      status = false;
    }

    while (status) {
      await Utils.sleep(1000);

      const result = await axios.post('https://api.rucaptcha.com/getTaskResult', {
        "clientKey": this.secret,
        "taskId": captcha.data.taskId,
      });
      this.logger.info(result.data);

      if (result.data.status === "ready") {
        status = false;
        this.logger.info(result.data.solution);

        return {
          id: Number(captcha.data.taskId),
          text: result.data.solution.text.trim().toLowerCase() as string,
        };
      } else if (result.data.errorId > 0) {
        status = false;
        this.logger.error(result.data.errorDescription);
      }
    }

    return false;
  }

  async report(id: number) {
    await axios.post('https://api.rucaptcha.com/reportIncorrect', {
      "clientKey": this.secret,
      "taskId": id,
    });
  }

  async correct(id: number) {
    await axios.post('https://api.rucaptcha.com/reportCorrect', {
      "clientKey": this.secret,
      "taskId": id,
    });
  }
}
