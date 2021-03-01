const { Logger } = require('../utils');

describe('Default Logger', () => {
  it('Can log a warning without details', () => {
    const warningsStorage = [];
    const logFn = (formattedString, rawString) => {
      warningsStorage.push(rawString);
    };

    const logger = new Logger(logFn);
    logger.warn('This is a warning text');
    expect(warningsStorage).toHaveLength(1);
    expect(warningsStorage[0]).toBe('Warning: This is a warning text');
  });

  it('Can log a warning with line position', () => {
    const warningsStorage = [];
    const logFn = (formattedString, rawString) => {
      warningsStorage.push(rawString);
    };

    const logger = new Logger(logFn);
    logger.warn('This is a warning text', [2]);
    expect(warningsStorage).toHaveLength(1);
    expect(warningsStorage[0]).toBe('Warning at line 2: This is a warning text');
  });

  it('Can log a warning with a reference to a file', () => {
    const warningsStorage = [];
    const logFn = (formattedString, rawString) => {
      warningsStorage.push(rawString);
    };

    const logger = new Logger(logFn);
    logger.warn('This is a warning text', [undefined, 'inner.apib']);
    expect(warningsStorage).toHaveLength(1);
    expect(warningsStorage[0]).toBe('Warning (see inner.apib): This is a warning text');
  });

  it('Can log a warning with line position and a reference to a file', () => {
    const warningsStorage = [];
    const logFn = (formattedString, rawString) => {
      warningsStorage.push(rawString);
    };

    const logger = new Logger(logFn);
    logger.warn('This is a warning text', [2, 'inner.apib']);
    expect(warningsStorage).toHaveLength(1);
    expect(warningsStorage[0]).toBe('Warning at line 2 (see inner.apib): This is a warning text');
  });

  it('Can call methods without log function', () => {
    const logger = new Logger();
    expect(() => logger.warn('This is a warning text')).not.toThrowError();
  });
});
