const chalk = require('chalk');

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : LOG_LEVELS.INFO;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');

    return `[${timestamp}] [${level}] ${message} ${formattedArgs}`.trim();
  }

  error(message, ...args) {
    if (this.level >= LOG_LEVELS.ERROR) {
      const formatted = this.formatMessage('ERROR', message, ...args);
      console.error(chalk.red(formatted));
    }
  }

  warn(message, ...args) {
    if (this.level >= LOG_LEVELS.WARN) {
      const formatted = this.formatMessage('WARN', message, ...args);
      console.warn(chalk.yellow(formatted));
    }
  }

  info(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage('INFO', message, ...args);
      console.log(chalk.blue(formatted));
    }
  }

  debug(message, ...args) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, ...args);
      console.log(chalk.gray(formatted));
    }
  }

  success(message, ...args) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formatted = this.formatMessage('SUCCESS', message, ...args);
      console.log(chalk.green(formatted));
    }
  }
}

const logger = new Logger();

module.exports = { logger, LOG_LEVELS };
