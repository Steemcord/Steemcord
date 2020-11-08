import { app } from 'electron';
import CatLoggr from 'cat-loggr/ts';
const loggr = new CatLoggr();

class ChildLogger {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  log(...a) {
    if (!app.isPackaged) loggr.log(`[${this.prefix}]`, ...a);
  }

  info(...a) {
    if (!app.isPackaged) loggr.info(`[${this.prefix}]`, ...a);
  }

  warn(...a) {
    if (!app.isPackaged) loggr.warn(`[${this.prefix}]`, ...a);
  }

  error(...a) {
    if (!app.isPackaged) loggr.error(`[${this.prefix}]`, ...a);
  }
}

export default (prefix: string): ChildLogger => new ChildLogger(prefix);