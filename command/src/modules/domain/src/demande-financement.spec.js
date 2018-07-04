const DemandeFinancement = require('./demande-financement');
const chai = require('chai');
const assertArrays = require('chai-arrays');

// id
const DemandeFinancementId = require('./demande-financement-id');

// events
const DemandeFinancementCreated = require('./event-demande-financement-created');
const MontantDemandeAdded = require('./event-montant-demande-added');
const DemandeFinancementDeleted = require('./event-demande-financement-deleted');

chai.use(assertArrays);

describe('Demande-financement Aggregate', () => {
  const author = 'author@example.fr';
  const demandeFinancementContent = { say: 'Hello' };
  let demandeFinancementId = new DemandeFinancementId('demandeFinancementA');

  it('When create demandeFinancementId Then toString return id', () => {
    demandeFinancementId = new DemandeFinancementId('M1');

    chai.expect(demandeFinancementId.toString()).to.equal(('demandeFinancement:M1'));
  });

  it('When create demandeFinancement Then raise DemandeFinancementCreated', () => DemandeFinancement.create(author, demandeFinancementContent)
    .then((eventsRaised) => {
      chai.expect(eventsRaised).to.have.length(1);
      const event = eventsRaised[0];
      chai.expect(event).to.be.an.instanceof(DemandeFinancementCreated);
      chai.expect(event.author).to.equal(author);
      chai.expect(event.content).to.equal(demandeFinancementContent);
      chai.expect(event.aggregateId).to.be.instanceOf(DemandeFinancementId);
    }));

  it('When create several demandeFinancements Then demandeFinancementId is not same', () => {
    const eventsRaised = [];
    DemandeFinancement.create(author, demandeFinancementContent)
      .then((events) => {
        events.forEach(event => eventsRaised.push(event));
        DemandeFinancement.create(author, demandeFinancementContent)
          .then((events2) => {
            events2.forEach(event => eventsRaised.push(event));
            chai.expect(eventsRaised[0].aggregateId)
              .not
              .to
              .equal(eventsRaised[1].aggregateId);
          });
      });
  });

  it('When create demandeFinancement Then return an event with demandeFinancementId as aggregateId', () => {
    DemandeFinancement.create(author, demandeFinancementContent)
      .then((events) => {
        chai.expect(events).to.have.length(1);
        chai.expect(events[0]).to.have.property('aggregateId');
        chai.expect(events[0].aggregateId).to.be.instanceOf(DemandeFinancementId);
      });
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

    userDemandeFinancement.delete(deleter)
      .then((eventsRaised) => {
        const expectedEvent =
        new DemandeFinancementDeleted(deleteDemandeFinancementId, deleter);
        chai.expect(eventsRaised).to.be.ofSize(1);
        chai.expect(eventsRaised[0].aggregateId).to.deep.equal(expectedEvent.aggregateId);
      });
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

    userDemandeFinancement.delete(author)
      .then((eventsRaised) => {
        chai.expect(eventsRaised).to.have.length(0);
      });
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
    userDemandeFinancement.ajouterMontantDemande(
      { id: 'updator' },
      { ttc: 123.56 },
    ).then((eventsRaised) => {
      chai.expect(eventsRaised).to.be.ofSize(1);
      const expectedEvent =
      new MontantDemandeAdded(demandeFinancementId, author, 123.56);
      chai.expect(eventsRaised).to.be.ofSize(1);
      chai.expect(eventsRaised[0].aggregateId).to.deep.equal(expectedEvent.aggregateId);
    });
  });

  describe('State', () => {
    it('Given a JSON State When "Wrap" then a DemandeFinancement instance is returned', () => {
      const jsonState = {
        aggregateId: {
          id: '37846d7a-d3cf-435d-a0df-0fe0e2f44cfb',
        },
        author: {
          id: 'admin',
          title: 'Admin',
        },
        _active: true,
        status: 'REQUESTED',
        montant: {
          ttc: 1234.56,
        },
        _updated: 1530557774781.0,
      };
      const demandeFinancement = DemandeFinancement.wrap(jsonState);
      // delete is an internal function of DemandeFinancement Domain Aggregate
      chai.expect(demandeFinancement).to.have.property('delete');
      chai.expect(demandeFinancement).to.have.property('status', jsonState.status);
    });
    it('Given an event When "Applying" on current state then return newly state', () => {
      const demandeFinancement = DemandeFinancement.createFromEvents([
        new DemandeFinancementCreated(
          demandeFinancementId,
          author,
          demandeFinancementContent,
        ),
      ]);
      demandeFinancement.apply(new MontantDemandeAdded(demandeFinancementId, author, 123.56));
      // newly State should have "montant" property
      chai.expect(demandeFinancement).to.have.property('montant', 123.56);
    });
  });

  describe('Permission functions', () => {
    it(
      'canCreateDemandeFinancement should throw an Exception on invalid status',
      () => DemandeFinancement.canCreateDemandeFinancement({}, { status: 'REGISTERED' }).catch((error) => {
        chai.expect(error.type).to.equal('BusinessRuleError');
        chai.expect(error.message).to.equal('Demande Financement Status should be REQUESTED or SUPPORTED on Creation');
      }),
    );
    it(
      'canAddMontantDemande should throw an Exception on negative amount',
      () => DemandeFinancement.canAddMontantDemande({}, {}, { ttc: -1 }).catch((error) => {
        chai.expect(error.type).to.equal('BusinessRuleError');
        chai.expect(error.message).to.equal('Demande Financement Status should be REQUESTED or SUPPORTED on Creation');
      }),
    );
    it(
      'canDeleteDemandeFinancement should throw an Exception when deleter is not creator',
      () => DemandeFinancement.canDeleteDemandeFinancement({ id: 'deleter' }, { author: { id: 'creator' } }).catch((error) => {
        chai.expect(error.type).to.equal('BusinessRuleError');
        chai.expect(error.message).to.equal('Demande Financement Status should be REQUESTED or SUPPORTED on Creation');
      }),
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
