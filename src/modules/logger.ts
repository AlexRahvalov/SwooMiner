const winston = require('winston');

export default class Logger {
  private logger;

  private readonly service;
  private level = 'verbose';

  constructor(meta: { service: string, phone?: string } = {
    service: 'core'
  }) {
    this.logger = winston.createLogger({
      level: this.level,
      defaultMeta: meta,
      format: winston.format.json(),
      transports: [
        new winston.transports.File({filename: `logs/${(new Date()).toLocaleDateString()}_${meta.service}.log`}),
      ],
    });


    this.logger.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
  }

  error(message: string) {
    this.logger.error(`[${(new Date()).toLocaleString()}] ${message}`);
  }

  info(message: string) {
    this.logger.info(`[${(new Date()).toLocaleString()}] ${message}`);
  }

  verbose(message: string) {
    this.logger.verbose(`[${(new Date()).toLocaleString()}] ${message}`);
  }

  debug(message: string) {
    this.logger.debug(`[${(new Date()).toLocaleString()}] ${message}`);
  }
}
