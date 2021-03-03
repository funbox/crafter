class Logger {
  constructor(logFn) {
    this.logFn = logFn;
  }

  warn(text, details = []) {
    const [linePos, currentFile] = details;
    const positionText = linePos ? ` at line ${linePos}` : '';
    const fileText = currentFile ? ` (see ${currentFile})` : '';
    if (this.logFn) {
      this.logFn('\x1b[33m%s\x1b[0m', `Warning${positionText}${fileText}: ${text}`); // yellow color
    }
  }
}

module.exports = Logger;
