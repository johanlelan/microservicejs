const logger = require('./logger');
const chai = require('chai');

describe('Logger', () => {
  it('Should trace debug log', () => {
    const detail = {};
    logger.debug('message Debug', detail);
  });
  it('Should trace info log', () => {
    const detail = {};
    logger.info('message Info', detail);
  });
  it('Should trace warn log', () => {
    const detail = {};
    logger.warn('message Warn', detail);
  });
  it('Should trace error log', () => {
    const detail = {};
    logger.error('message Error', detail);
  });
});
