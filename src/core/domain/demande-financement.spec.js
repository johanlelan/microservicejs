const DemandeFinancement = require('./demande-financement');
const chai = require('chai');
const assertArrays = require('chai-arrays');

// id
const DemandeFinancementId = require('./demande-financement-id');

// events
const DemandeFinancementCreated = require('./event-demande-financement-created');
const DemandeFinancementUpdated = require('./event-demande-financement-updated');
const DemandeFinancementDeleted = require('./event-demande-financement-deleted');

chai.use(assertArrays);

let eventsRaised = [];
const publishEvent = function publishEvent(evt) {
  eventsRaised.push(evt);
};

describe('Demande-financement Aggregate', () => {
  const author = 'author@example.fr';
  const demandeFinancementContent = 'Hello';
  let demandeFinancementId = new DemandeFinancementId('demandeFinancementA');

  beforeEach(() => {
    eventsRaised = [];
  });

  it('When create demandeFinancementId Then toString return id', () => {
    demandeFinancementId = new DemandeFinancementId('M1');

    chai.expect(demandeFinancementId.toString()).to.equal(('demandeFinancement:M1'));
  });

  it('When create demandeFinancement Then raise DemandeFinancementCreated', () => {
    DemandeFinancement.create(publishEvent, author, demandeFinancementContent);

    chai.expect(eventsRaised).to.have.length(1);
    const event = eventsRaised[0];
    chai.expect(event).to.be.an.instanceof(DemandeFinancementCreated);
    chai.expect(event.author).to.equal(author);
    chai.expect(event.content).to.equal(demandeFinancementContent);
    chai.expect(event.aggregateId).to.be
      .instanceOf(DemandeFinancementId);
  });

  it('When create several demandeFinancements Then demandeFinancementId is not same', () => {
    DemandeFinancement.create(publishEvent, author, demandeFinancementContent);
    DemandeFinancement.create(publishEvent, author, demandeFinancementContent);

    chai.expect(eventsRaised[0].aggregateId)
      .not
      .to
      .equal(eventsRaised[1].aggregateId);
  });

  it('When create demandeFinancement Then return demandeFinancementId', () => {
    const result = DemandeFinancement.create(publishEvent, author, demandeFinancementContent);

    chai.expect(result).to.equal(eventsRaised[0].aggregateId);
  });

  it('When create DemandeFinancementCreated Then getAggregateId return demandeFinancementId', () => {
    const event = new DemandeFinancementCreated(new DemandeFinancementId('M2'), author, demandeFinancementContent);

    chai.expect(event.aggregateId).to.equal(event.aggregateId);
  });

  it('When create DemandeFinancementCreated Then aggregateId is demandeFinancementId', () => {
    const event = new DemandeFinancementCreated(demandeFinancementId, author);

    chai.expect(event.aggregateId).to.equal(event.aggregateId);
  });

  it('When create demandeFinancementDeleted Then aggregateId is demandeFinancementId', () => {
    const event = new DemandeFinancementDeleted(demandeFinancementId);

    chai.expect(event.aggregateId).to.equal(event.aggregateId);
  });

  it('When delete Then raise demandeFinancementDeleted', () => {
    const userDemandeFinancement = DemandeFinancement.createFromEvents([
      new DemandeFinancementCreated(
        demandeFinancementId,
        author,
        demandeFinancementContent,
      ),
    ]);
    const deleter = author;

    userDemandeFinancement.delete(publishEvent, deleter);

    const expectedEvent =
      new DemandeFinancementDeleted(demandeFinancementId, deleter);
    chai.expect(eventsRaised).to.be.ofSize(1);
    chai.expect(eventsRaised[0].aggregateId).to.deep.equal(expectedEvent.aggregateId);
  });

  it('Given deleted demandeFinancement When delete Then nothing', () => {
    const userDemandeFinancement = DemandeFinancement.createFromEvents([
      new DemandeFinancementCreated(
        demandeFinancementId,
        author,
        demandeFinancementContent,
      ),
      new DemandeFinancementDeleted(demandeFinancementId, author),
    ]);

    userDemandeFinancement.delete(publishEvent, author);

    chai.expect(eventsRaised).to.have.length(0);
  });


  it('When create demandeFinancementUpdated Then aggregateId is demandeFinancementId', () => {
    const event = new DemandeFinancementUpdated(demandeFinancementId);

    chai.expect(event.aggregateId).to.equal(event.aggregateId);
  });

  it('Given patch demandeFinancement When demandeFinancement is updated', () => {
    const userDemandeFinancement = DemandeFinancement.createFromEvents([
      new DemandeFinancementCreated(
        demandeFinancementId,
        author,
        demandeFinancementContent,
      ),
      new DemandeFinancementUpdated(demandeFinancementId, author, 
        { op: 'add', path: 'title', value: 'new title' }),
    ]);

    chai.assert.isOk(userDemandeFinancement.isUpdated);
  });
});
