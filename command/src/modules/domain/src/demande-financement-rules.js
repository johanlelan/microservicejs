const { Engine } = require('json-rules-engine');

exports.create = (standardRules, options = { allowUndefinedFacts: true }) => {
  const engine = new Engine(standardRules, options);
  return engine;
};
