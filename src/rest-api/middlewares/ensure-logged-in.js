// ensureLoggedIn is a middleware function which
// ensures that the user is authenticated

const passport = require('passport');
const PassportHttp = require('passport-http');

// TODO JLL: temporary use fix users list
const users = [
  { id: 'guest', title: 'Guest', password: 'tseug' },
  { id: 'admin', title: 'Admin', password: 'nimda' },
];

passport.use(new PassportHttp.BasicStrategy(((userid, password, done) => {
  const currentUser = users.find(user => user.id === userid);
  if (!currentUser) {
    return done(null, false);
  }
  if (currentUser.password !== password) {
    return done(null, false);
  }
  return done(null, {
    id: currentUser.id,
    title: currentUser.title,
  });
})));

module.exports = function ensureLoggedIn(req, res, next) {
  return passport.authenticate('basic', { session: false })(req, res, next);
};
