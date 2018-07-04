const debug = require('debug')('microservice:domain:demande-financement:rule-engine');
const { Engine } = require('json-rules-engine');

const stdRules = [
  // Creation is only allowed WITH REQUESTED and SUPPORTED status
  {
    conditions: {
      all: [{
        fact: 'createDemandeFinancement',
        path: '.demandeFinancement.status',
        operator: 'notEqual',
        value: 'REQUESTED',
      }, {
        fact: 'createDemandeFinancement',
        path: '.demandeFinancement.status',
        operator: 'notEqual',
        value: 'SUPPORTED',
      }],
    },
    event: {
      type: 'BusinessRuleError',
      params: {
        statusCode: 422,
        message: 'Demande Financement Status should be REQUESTED or SUPPORTED on Creation',
      },
    },
  },
  // Do not allow negative montantDemande
  {
    conditions: {
      all: [{
        fact: 'addMontantDemande',
        path: '.montantDemande.ttc',
        operator: 'lessThan',
        value: 0,
      }],
    },
    event: {
      type: 'BusinessRuleError',
      params: {
        statusCode: 422,
        message: 'Could not set a negative "MontantDemande"',
      },
    },
  },
  // Deletion, only creator can delete its demande-financement
  {
    conditions: {
      all: [{
        fact: 'deleteDemandeFinancement',
        path: '.demandeFinancement.author.id',
        operator: 'notEqual',
        value: {
          fact: 'deleteDemandeFinancement',
          path: '.user.id',
        },
      }],
    },
    event: {
      type: 'BusinessRuleError',
      params: {
        statusCode: 403,
        message: 'Only creator can delete its demandeFinancement',
      },
    },
  },
];

const engine = new Engine(stdRules, {
  allowUndefinedFacts: true,
});

engine.on('failure', (event, almanac, ruleResult) => {
  debug('Business rule failed', event, ruleResult);
});

module.exports = engine;
