const chai = require('chai');

const createEventsStore = require('../infrastructure/event-store').create;
const DemandeFinancement = require('../domain/demande-financement');
const Repository = require('./repository');
const ErrorNotFound = require('./ErrorNotFound');
const DemandeFinancementId = require('../domain/demande-financement-id');

const fakeLogger = {
  info: console.info,
}

// events
const DemandeFinancementCreated = require('../domain/event-demande-financement-created');

describe('Repository', () => {
  let repository;
  let eventsStore;
  let publishEvent;

  beforeEach(() => {
    eventsStore = createEventsStore(fakeLogger);
    repository = Repository.create(DemandeFinancement, eventsStore);
    publishEvent = (evt) => {
      eventsStore.append(evt);
    };
  });

  it('Given no events When GetById Then throw UnknownDemandeFinancement', () => {
    chai.expect(() => {
      repository.getById(new DemandeFinancementId('BadId'));
    }).to.throw(ErrorNotFound);
  });

  it('Given several events When GetById Then Return DemandeFinancement', () => {
    const defId = new DemandeFinancementId('def1');
    const newDemandeFinancement = DemandeFinancement.createFromEvents([
      new DemandeFinancementCreated(defId, 'demande-financement-repository@example.com', 'any-content'),
    ]);
    newDemandeFinancement.delete(publishEvent, 'deleter@example.com');

    const demandeFinancementFromRepository = repository.getById(defId);
    chai.expect(demandeFinancementFromRepository.toString())
      .to
      .equal(newDemandeFinancement.toString());
  });
});
