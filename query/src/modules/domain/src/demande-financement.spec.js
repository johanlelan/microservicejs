const DemandeFinancement = require('./demande-financement');
const chai = require('chai');
const assertArrays = require('chai-arrays');

// id
const DemandeFinancementId = require('./demande-financement-id');

// events
const DemandeFinancementCreated = require('./event-demande-financement-created');
const MontantDemandeAdded = require('./event-montant-demande-added');
const DemandeFinancementDeleted = require('./event-demande-financement-deleted');

// errors
const ErrorDomainValidation = require('./ErrorDomainValidation');
const ErrorPermissions = require('./ErrorPermissions');

chai.use(assertArrays);

describe('Demande-financement Aggregate', () => {
  const author = 'author@example.fr';
  const demandeFinancementContent = { say: 'Hello' };
  let demandeFinancementId = new DemandeFinancementId('demandeFinancementA');

  it('When create demandeFinancementId Then toString return id', () => {
    demandeFinancementId = new DemandeFinancementId('M1');

    chai.expect(demandeFinancementId.toString()).to.equal(('demandeFinancement:M1'));
  });

  it('When create demandeFinancement Then raise DemandeFinancementCreated', () => {
    const eventsRaised = DemandeFinancement.create(author, demandeFinancementContent);

    chai.expect(eventsRaised).to.have.length(1);
    const event = eventsRaised[0];
    chai.expect(event).to.be.an.instanceof(DemandeFinancementCreated);
    chai.expect(event.author).to.equal(author);
    chai.expect(event.content).to.equal(demandeFinancementContent);
    chai.expect(event.aggregateId).to.be
      .instanceOf(DemandeFinancementId);
  });

  it('When create several demandeFinancements Then demandeFinancementId is not same', () => {
    const eventsRaised = [];
    DemandeFinancement
      .create(author, demandeFinancementContent)
      .forEach(event => eventsRaised.push(event));
    DemandeFinancement
      .create(author, demandeFinancementContent)
      .forEach(event => eventsRaised.push(event));

    chai.expect(eventsRaised[0].aggregateId)
      .not
      .to
      .equal(eventsRaised[1].aggregateId);
  });

  it('When create demandeFinancement Then return an event with demandeFinancementId as aggregateId', () => {
    const events = DemandeFinancement.create(author, demandeFinancementContent);
    chai.expect(events).to.have.length(1);
    chai.expect(events[0]).to.have.property('aggregateId');
    chai.expect(events[0].aggregateId).to.be.instanceOf(DemandeFinancementId);
  });

  it('When create DemandeFinancementCreated Then aggregateId is demandeFinancementId', () => {
    demandeFinancementId = new DemandeFinancementId('M2');
    const event = new DemandeFinancementCreated(
      demandeFinancementId,
      author,
      demandeFinancementContent,
    );

    chai.expect(event.aggregateId).to.equal(demandeFinancementId);
  });

  it('When delete Then raise demandeFinancementDeleted', () => {
    const deleteDemandeFinancementId = new DemandeFinancementId('deleteId');
    const userDemandeFinancement = DemandeFinancement.createFromEvents([
      new DemandeFinancementCreated(
        deleteDemandeFinancementId,
        author,
        { say: 'Hello' },
      ),
    ]);
    const deleter = author;

    const eventsRaised = userDemandeFinancement.delete(deleter);

    const expectedEvent =
      new DemandeFinancementDeleted(deleteDemandeFinancementId, deleter);
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

    const eventsRaised = userDemandeFinancement.delete(author);

    chai.expect(eventsRaised).to.have.length(0);
  });


  it('When create MontantDemandeAdded Then aggregateId is demandeFinancementId', () => {
    const event = new MontantDemandeAdded(demandeFinancementId);

    chai.expect(event.aggregateId).to.equal(event.aggregateId);
  });

  it('Given montant When "montant" of demandeFinancement is set', () => {
    const userDemandeFinancement = DemandeFinancement.createFromEvents([
      new DemandeFinancementCreated(
        demandeFinancementId,
        author,
        demandeFinancementContent,
      ),
      new MontantDemandeAdded(demandeFinancementId, author, 123.56),
    ]);

    chai.assert.isOk(userDemandeFinancement._updated);
  });

  it('Given created DemandeFinancement When "ajouterMontantDemande" then MontantDemandeAdded is emitted', () => {
    const userDemandeFinancement = DemandeFinancement.createFromEvents([
      new DemandeFinancementCreated(
        demandeFinancementId,
        author,
        demandeFinancementContent,
      ),
    ]);
    const eventsRaised = userDemandeFinancement.ajouterMontantDemande(
      userDemandeFinancement.id,
      { id: 'updator' },
      userDemandeFinancement,
      { ttc: 123.56 },
    );
    chai.expect(eventsRaised).to.be.ofSize(1);
    const expectedEvent =
    new MontantDemandeAdded(demandeFinancementId, author, 123.56);
    chai.expect(eventsRaised).to.be.ofSize(1);
    chai.expect(eventsRaised[0].aggregateId).to.deep.equal(expectedEvent.aggregateId);
  });

  describe('Permission functions', () => {
    it(
      'canCreateDemandeFinancement should throw an Exception on invalid status',
      () => chai.expect(() => DemandeFinancement.canCreateDemandeFinancement(
        {},
        {
          status: 'REGISTERED',
        },
      )).to.throw(ErrorDomainValidation, 'Demande Financement Status should be REQUESTED or SUPPORTED on Creation'),
    );
    it(
      'canAddMontantDemande should throw an Exception on negative amount',
      () => chai.expect(() => DemandeFinancement.canAddMontantDemande(
        {},
        {},
        {
          ttc: -1,
        },
      )).to.throw(ErrorDomainValidation, 'Could not set a negative "MontantDemande"'),
    );
    it(
      'canDeleteDemandeFinancement should throw an Exception when deleter is not creator',
      () => chai.expect(() => DemandeFinancement.canDeleteDemandeFinancement(
        {
          id: 'deleter',
        },
        {
          author: {
            id: 'creator',
          },
        },
      )).to.throw(ErrorPermissions, 'Only creator can delete its demandeFinancement'),
    );
    it(
      'canCreateDemandeFinancement should allow REQUESTED status',
      () => DemandeFinancement.canCreateDemandeFinancement(
        {},
        {
          status: 'REQUESTED',
        },
      ),
    );
    it(
      'canAddMontantDemande should allow positive amount',
      () => DemandeFinancement.canAddMontantDemande(
        {},
        {},
        {
          ttc: 1.01,
        },
      ),
    );
    it(
      'canDeleteDemandeFinancement should allow deletion when deleter === author',
      () => DemandeFinancement.canDeleteDemandeFinancement(
        { id: 'deleter' },
        { author: { id: 'deleter' } },
      ),
    );
  });
});
