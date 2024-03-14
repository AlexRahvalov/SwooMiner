const winston = require('winston');

export default class Logger {
  private logger;

  private readonly service;
  private level = 'verbose';

  constructor(service = 'core') {
    this.service = service;

    this.logger = winston.createLogger({
      level: this.level,
      format: winston.format.json(),
      transports: [
        new winston.transports.File({filename: `logs/${(new Date()).toLocaleDateString()}_${service}.log`}),
      ],
    });


    this.logger.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
  }

  error(phone, message) {
    this.logger.error(message, {
      service: this.service,
      phone
    });
  }

  info(phone, message) {
    this.logger.info(message, {
      service: this.service,
      phone
    });
  }

  verbose(phone, message) {
    this.logger.verbose(message, {
      service: this.service,
      phone
    });
  }
}
