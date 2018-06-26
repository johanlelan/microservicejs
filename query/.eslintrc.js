module.exports = { 
  extends: 'airbnb-base',
  globals: {
    expect: true,
  },
  env: {
    mocha: true,
    node: true
  },
  rules: {
    "no-underscore-dangle": [
      2,
      {
        allow: [
          '_meta',
          '_updated',
          '_deleted',
        ]
      }
    ]
  }
};