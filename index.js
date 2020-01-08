if(process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/* TEST USER "DATABASE" */

let users = [];

/* -------------------- */

const path = require('path');
const express = require('express');
const { postgraphile } = require('postgraphile');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const passportInit = require('./passport-config');

passportInit(
  passport,
  (username, googleId) => {
    const user = {
      username,
      googleId
    };
    users.push(user);
    return user;
  },
  id => users.find(user => user.googleId === id)
);

const port = 3000;
const dbScheme = 'cudash';
const staticDir = process.env.CUDASH_STATIC_DIR || './cudash';

const pgConfig = {
  host: process.env.CUDASH_PG_HOST || '127.0.0.1',
  port: process.env.CUDASH_PG_PORT || 5432,
  user: process.env.CUDASH_PG_USER,
  password: process.env.CUDASH_PG_PASSWORD,
  database: process.env.CUDASH_PG_DBNAME,
};

const pgOptions = {
  graphileBuildOptions: { orderByNullsLast: true },
  enhanceGraphiql: true,
  dynamicJson: true,
  enableCors: true,
  disableQueryLog: true
};

const checkAuthenticated = (req, res, next) => {
  if(req.isAuthenticated())
    return next();

  res.redirect('/auth');
}

const checkNotAuthenticated = (req, res, next) => {
  if(req.isAuthenticated())
    return res.redirect('/');

  next();
}

const app = express();

app.set('view-engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth', checkNotAuthenticated, (req, res) => {
  res.render('auth.ejs');
});

app.post('/auth', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/auth',
  failureFlash: true
}));

app.get('/auth/google', checkNotAuthenticated, passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/auth');
});

app.post('/graphql', checkAuthenticated, postgraphile(pgConfig, dbScheme, pgOptions));

/* SERVE STATIC FILES OF CUDASH */
app.use(checkAuthenticated, express.static(staticDir));
/* ---------------------------- */

app.listen(port, () => {
  console.log(`CUDASH is running on port ${port}!`);
});
