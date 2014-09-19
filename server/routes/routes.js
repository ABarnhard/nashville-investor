'use strict';

var morgan         = require('morgan'),
    bodyParser     = require('body-parser'),
    methodOverride = require('express-method-override'),
    session        = require('express-session'),
    RedisStore     = require('connect-redis')(session),
    debug          = require('../lib/debug'),
    security       = require('../lib/security'),
    users          = require('../controllers/users'),
    permits        = require('../controllers/permits'),
    devApps        = require('../controllers/devapps'),
    home           = require('../controllers/home'),
    value          = require('../controllers/value');

module.exports = function(app, express){
  app.use(morgan('dev'));
  app.use(express.static(__dirname + '/../../public'));
  app.use(bodyParser.urlencoded({extended:true}));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(session({store:new RedisStore(), secret:'my super secret key', resave:true, saveUninitialized:true, cookie:{maxAge:null}}));

  app.use(security.authenticate);
  app.use(debug.info);

  app.get('/home', home.index);
  app.post('/register', users.register);
  app.post('/login', users.login);
  app.get('/permits', permits.index);
  app.get('/devapps', devApps.index);
  app.get('/value', value.getData);

  app.use(security.bounce);
  app.delete('/logout', users.logout);

  console.log('Express: Routes Loaded');
};
