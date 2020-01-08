const GoogleStrategy = require('passport-google-oauth20').Strategy;

const initialize = (passport, addUser, getUserById) => {
  const auth = (accessToken, refreshToken, profile, done) => {
    const currentUser = getUserById(profile.id);
    if(currentUser) {
      done(null, currentUser);
    } else {
      const newUser = addUser(profile.displayName, profile.id);
      done(null, newUser);
    }
  }

  passport.use(new GoogleStrategy({
    callbackURL: '/auth/google/callback',
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  }, auth));

  passport.serializeUser((user, done) => done(null, user.googleId));
  passport.deserializeUser((id, done) => done(null, getUserById(id)));
}

module.exports = initialize;
