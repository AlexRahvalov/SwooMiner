import winston from 'winston';

interface WinstonLogger {
  error: (message: string) => void;
  info: (message: string) => void;
  verbose: (message: string) => void;
  debug: (message: string) => void;
  add: (transport: any) => void;
}

export default class Logger {
  private logger: WinstonLogger;

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
    }) as WinstonLogger;


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
