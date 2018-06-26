const infrastructure = require('../../infrastructure');

const UserId = require('./user-id');
const UserRegistered = require('./event-user-registered');

exports.create = function create(content) {
  return [
    new UserRegistered(
      new UserId(infrastructure.idGenerator.generate()),
      content,
    ),
  ];
};

const User = function User(events) {
  infrastructure.HydrateProcessor.create().register(UserRegistered, (event) => {
    this.id = event.aggregateId;
  }).apply(events);
};

exports.createFromEvents = function createFromEvents(events) {
  return new User(events);
};
