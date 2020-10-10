var express = require('express');
const bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Users = require('../models/users');

var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.username && req.session.user === 'authenticated'){
    Users.findOne({username : req.session.username})
    .then((user)=>{
      if(user !== null && user.admin){
        Users.find()
        .then((users)=>{
            res.statusCode = 200;
            res.setHeader('Content-Type','application/json');
            var userArray = new Array();
            for( var i=0; i<20&&i<users.length; i++){
              userArray.push(users[i]);
            }
            res.json(userArray);
        }, (err)=>next(err));
      }else{
        var err = new Error('Unauthorized Access');
        err.status = 401;
        next(err);
      }
    })
  }else{
    var err = new Error('You are not authenticated');
    res.setHeader('WWW-Authenticate','Basic');
    err.status = 401;
    return next(err);
  }
});

//Signup
router.post('/signup', (req, res, next)=>{
  Users.findOne({username : req.body.username})
  .then((user) => {
    if(user!=null){
      var err = new Error('User '+req.body.username+' already exists...');
      err.status = 403;
      next(err);
    }else{
      return Users.create({
        username : req.body.username,
        password : req.body.password,
        name : req.body.name,
        email : req.body.email,
        admin : req.body.admin
      });
    }
  })
  .then((user)=>{
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json({status : 'Registration Successful', user : user});
  }, (err)=>{next(err)})
  .catch((err)=>{next(err);});
});

//Login
router.post('/login', (req,res,next)=>{
  if(!req.session.user){
    var authHeaders = req.headers.authorization;

    if(!authHeaders){
      var err = new Error('You are not authenticated');
      res.setHeader('WWW-Authenticate','Basic');
      err.status = 401;
      return next(err);
    }

    var auth = new Buffer.from(authHeaders.split(' ')[1],'base64').toString().split(':');
    var username = auth[0];
    var password = auth[1];

    Users.findOne({username : username})
    .then((user)=>{
      if(user === null){
        var err = new Error('User '+username+' doesn\'t exist!');
        err.status = 403;
        return next(err);
      }else if(user.password !== password){
        var err = new Error('Password Is Incorrect');
        err.status = 403;
        return next(err);
      }else if(user.username === username && user.password === password){
        req.session.user = 'authenticated';
        req.session.username = username;
        res.statusCode = 200;
        res.setHeader('Content-Type','text/plain');
        res.end('You are authenticated');
      }
    })
    .catch((err)=>next(err));

  }else{
    res.statusCode = 200;
    res.setHeader('Content-Type','text/plain');
    res.end('You are already authenticated');
  }
});

//LogOut
router.get('/logout', (req,res,next)=>{
  if(req.session){
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }else{
    var err = new Error('You are not Logged In');
    err.status = 403;
    next(err);
  }
});


//Memos
router.route('/memos')
.all((req, res, next)=>{
  res.statusCode = 200;
  res.setHeader('Content-Type','application/json');
  next();
})
.get((req,res,next)=>{
  if(req.session.user == 'authenticated' && req.session.username){
    Users.findOne({username : req.session.username})
    .then((user)=>{
      if(user!==null){
        res.statusCode = 200;
        res.setHeader('Content-Type','appication/json');
        var memoArray = new Array();
        var today = new Date().getDate();
        var fortnightAgo = new Date();
        fortnightAgo.setDate(today-14);
        memoArray = user.memos;
        memoArray.filter((memo)=>{
          return memo.validity>today && memo.createdAt>fortnightAgo;
        });
        res.json(memoArray);
      }else{
        var err = new Error('User '+req.session.username+' doesn\'t exist!');
        err.status = 403;
        return next(err);
      }
    }, (err)=>next(err))
    .catch((err)=>next(err));
  }else{
    var err = new Error('You are not autheticated');
    res.setHeader('WWW-Authenticate','Basic');
    err.status = 401;
    return next(err);
  }
})
.post((req,res,next)=>{
  if(req.session.user == 'authenticated' && req.session.username){
    Users.findOne({username : req.session.username})
    .then((user)=>{
      if(user!==null){
        user.memos.push(req.body);
        user.save()
        .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type','appication/json');
          res.json(user);
        }, (err)=>next(err));
      }else{
        var err = new Error('User '+req.session.username+' doesn\'t exist!');
        err.status = 403;
        return next(err);
      }
    }, (err)=>next(err))
    .catch((err)=>next(err));
  }else{
    var err = new Error('You are not autheticated');
    res.setHeader('WWW-Authenticate','Basic');
    err.status = 401;
    return next(err);
  }
})
.delete((req,res,next)=>{
  if(req.session.user == 'authenticated' && req.session.username){
    Users.findOne({username : req.session.username})
    .then((user)=>{
      if(user!==null){
        for (var i = (user.memos.length -1 ); i>=0; i--){
          user.memos.id(user.memos[i]._id).remove();
        }
        user.save()
        .then((user)=>{
          res.statusCode = 200;
          res.setHeader('Content-Type','application/json');
          res.json(user);
        }, (err)=>next(err));
      }else{
        var err = new Error('User '+req.session.username+' doesn\'t exist!');
        err.status = 403;
        return next(err);
      }
    }, (err)=>next(err))
    .catch((err)=>next(err));
  }else{
    var err = new Error('You are not autheticated');
    res.setHeader('WWW-Authenticate','Basic');
    err.status = 401;
    return next(err);
  }
})

module.exports = router;