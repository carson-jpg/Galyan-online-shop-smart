const fs = require('fs');
const path = require('path');

// Simple logger implementation
class Logger {
  constructor() {
    this.logFile = path.join(__dirname, '../logs/app.log');
    // Ensure logs directory exists
    const logsDir = path.dirname(this.logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  info(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    console.log(`INFO: ${message}`);
    fs.appendFileSync(this.logFile, logMessage);
  }

  error(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    console.error(`ERROR: ${message}`);
    fs.appendFileSync(this.logFile, logMessage);
  }

  warn(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}\n`;
    console.warn(`WARN: ${message}`);
    fs.appendFileSync(this.logFile, logMessage);
  }
}

const logger = new Logger();
module.exports = logger;
