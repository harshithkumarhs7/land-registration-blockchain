type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

class Logger {
  private format(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  info(message: string, meta?: any): void {
    console.log(`\x1b[36m${this.format('INFO', message, meta)}\x1b[0m`);
  }

  warn(message: string, meta?: any): void {
    console.warn(`\x1b[33m${this.format('WARN', message, meta)}\x1b[0m`);
  }

  error(message: string, meta?: any): void {
    console.error(`\x1b[31m${this.format('ERROR', message, meta)}\x1b[0m`);
  }

  success(message: string, meta?: any): void {
    console.log(`\x1b[32m${this.format('SUCCESS', message, meta)}\x1b[0m`);
  }
}

export const logger = new Logger();
