'use strict';

var bcrypt = require('bcrypt'),
    Mailgun = require('mailgun-js'),
    Mongo  = require('mongodb');

function User(){
}

Object.defineProperty(User, 'collection', {
  get: function(){return global.mongodb.collection('users');}
});

User.findById = function(id, cb){
  var _id = Mongo.ObjectID(id);
  User.collection.findOne({_id:_id}, cb);
};

User.register = function(o, cb){
  User.collection.findOne({email:o.email}, function(err, user){
    if(user || o.password.length < 3){return cb();}
    o.password = bcrypt.hashSync(o.password, 10);
    User.collection.save(o, cb);
  });
};

User.login = function(o, cb){
  User.collection.findOne({email:o.email}, function(err, user){
    if(!user){return cb();}
    var isOk = bcrypt.compareSync(o.password, user.password);
    if(!isOk){return cb();}
    cb(null, user);
  });
};

User.sendMail = function(email ,cb){
  sendMail(email, cb);
};

//HELPER FUNCTIONS
function sendMail(email, cb){
  var mailgun = new Mailgun({apiKey:'key-3a44495dd7b1ca0cf1364c996a745e5a', domain:'sandbox8cf072223c7743ba9a6bde64c8756a28.mailgun.org'}),
      data    = {from:email.email, to:'teamvoltron@mailinator.com', subject:email.subject, html:email.body};

  mailgun.messages().send(data, function(a, b , c){
    console.log(a, b, c);
    cb();
  });
}

module.exports = User;

