'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var QRcode = require('qrcode');
var speakeasy = require('speakeasy');
var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
// app.use(logger('dev'));
app.use(bodyParser.json());
let user = {
    'firstname': "chandu",
    'lastname' : "bala",
     email     : "chandubhimapalli4@gmail.com",
     password  : "12345"
}

app.post('/login', function (req, res) {
    if (!user.twofactor || !user.twofactor.secret) { 
        
        if (req.body.email == user.email && req.body.password == user.password) {
            return res.send('success');
        }
        return res.status(400).send('Invald email or password');
    } else {
        
        if (req.body.email != user.email || req.body.password != user.password) {
            return res.status(400).send('Invald email or password');
        }
        
        if (!req.headers['x-otp']) {
            return res.status(206).send('Please enter otp to continue');
        }
        
        var verified = speakeasy.totp.verify({
            secret: user.twofactor.secret,
            encoding: 'base32',
            token: req.headers['x-otp']
        });
        if (verified) { 
            return res.send('success');
        } else { 
            return res.status(400).send('Invalid OTP');
        }
    }
});


app.post('/twofactor/setup', function (req, res) {
    const secret = speakeasy.generateSecret({ length: 10 });
    QRcode.todataURL(secret, otpauth_url, (err, data_url) => {
        user.twofactor = {
            secret: "",
            tempsecret: secret.base32,
            dataURL: data_url,
            otpURL: secret.otpauth_url
        };
        return res.json({
            message: 'verify OTP',
            tempsecret: secret.base32,
            data_URL: data_url,
            otpURL: otpauth_url
        });
    });
});


/*app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});*/

app.post('/twofactor/verify', function (req, res) {
    var verified = speakeasy.totp.verify({
        secret: user.twofactor.tempsecret,
        encoding: 'base32',
        token: req.body.token

    });
    if (verified) {
        user.twofactor.secret = user.twofactor.tempsecret;
        return res.send("two factor auth enabled");

    }
    return res.status(400).send("invalid token,verification failed");
});

app.get('/twofactor/setup/', function (req, res) {
    req.json(user.twofactor);
});
app.delete('/twofactor/setup/', function (req, res) {
    delete user.twofactor;
    res.send("success");
});

app.listen('3000', () => {
        console.log('app running on port number 3000');
  
});
