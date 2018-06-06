const User = require('./user');
const chai = require('chai');
const assertArrays = require('chai-arrays');

// id
const UserId = require('./user-id');

// events
const UserRegistered = require('./event-user-registered');

// errors
const ErrorDomainValidation = require('./ErrorDomainValidation');

chai.use(assertArrays);

describe('User Aggregate', () => {
  const author = 'author@example.fr';
  const userContent = { firstName: 'FirstName', lastName: 'LastName' };
  let userId = new UserId(author);

  beforeEach(() => {
    eventsRaised = [];
  });

  it('When create userId Then toString return id', () => {
    userId = new UserId('M1');

    chai.expect(userId.toString()).to.equal(('userId:M1'));
  });

  it('When create userId Then equals should evaluate equality between two userId', () => {
    userId1 = new UserId('M1');
    userId2 = new UserId('M1');

    chai.assert.ok(userId1.equals(userId2));
  });

  it('When given null userId Then return false', () => {
    userId1 = new UserId('M1');
    userId2 = undefined;

    chai.assert.ok(!userId1.equals(userId2));
  });

  it('When create userId with non id Then raise an exception', () => {
    chai.expect(() => new UserId()).to.throw(ErrorDomainValidation);
  });

  it('When create user Then raise UserRegistered', () => {
    const eventsRaised = User.create(userContent);

    chai.expect(eventsRaised).to.have.length(1);
    const event = eventsRaised[0];
    chai.expect(event).to.be.an.instanceof(UserRegistered);
    chai.expect(event.content).to.equal(userContent);
    chai.expect(event.aggregateId).to.be
      .instanceOf(UserId);
  });

  it('When create several users Then userId is not same', () => {
    const eventsRaised = [];
    User.create(userContent).forEach(event => eventsRaised.push(event));
    User.create(userContent).forEach(event => eventsRaised.push(event));

    chai.expect(eventsRaised[0].aggregateId)
      .not
      .to
      .equal(eventsRaised[1].aggregateId);
  });

  it('When create user Then return an event with userId as aggregateId', () => {
    const events = User.create(userContent);
    chai.expect(events).to.have.length(1);
    chai.expect(events[0]).to.have.property('aggregateId');
    chai.expect(events[0].aggregateId).to.be.instanceOf(UserId);
  });

  it('When create userRegistered Then aggregateId is userId', () => {
    const userId = new UserId('M2');
    const event = new UserRegistered(userId, author, userContent);

    chai.expect(event.aggregateId).to.equal(userId);
  });

  it('When given several events Then rebuild User', () => {
    const user = User.createFromEvents([
      new UserRegistered(
        userId,
        userContent,
      ),
    ]);
    chai.expect(user.id).to.equal(userId);
  });
});
