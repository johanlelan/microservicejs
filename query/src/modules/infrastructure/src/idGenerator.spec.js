const idGenerator = require('./idGenerator');
const chai = require('chai');

describe('idGenerator', () => {
  it('When generate several id Then return always different id', () => {
    const id1 = idGenerator.generate();
    const id2 = idGenerator.generate();

    chai.expect(id1).not.to.equal(id2);
  });
});
