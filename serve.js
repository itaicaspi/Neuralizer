var express = require('express');
var crypto = require('crypto');
var sqlite3 = require('sqlite3');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var app = express();
var path = require('path');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var session = require('express-session');
var fs = require('fs');
var uniqueFilename = require('unique-filename')

var models_root = path.join(__dirname, "models");
var root = path.join(__dirname, "../public_html/neuralizer.ai");
var db = new sqlite3.Database('./Neuralizer.db');

// initialize app
app.use(cookieParser());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(session({
  secret: require('crypto').randomBytes(64).toString('hex'),
  resave: true,
  saveUninitialized: true,
  cookie: { httpOnly: true, maxAge: 30*24*60*60*1000 }
}));
app.use(passport.initialize());
app.use(passport.session());


// hash password using salt
function hashPassword(password, salt) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  hash.update(salt);
  return hash.digest('hex');
}

// serializion
passport.serializeUser(function(user, done) {
  return done(null, user.id);
});

//deserializion
passport.deserializeUser(function(id, done) {
  db.get('SELECT id, username FROM users WHERE id = ?', id, function(err, user) {
    if (!user) return done(null, false);
    return done(null, user);
  });
});

// passport log in strategy
passport.use('login', new LocalStrategy(
  function(username, password, done) {
	console.log("login", username);
	
    db.get('SELECT salt FROM users WHERE username = ?', username, function(err, user) {
	// validate username
	if (!user) return done(null, false, { message: 'Incorrect username.' });
	// validate password
    var hash = hashPassword(password, user.salt);
    db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, function(err, user) {
		// Invalid password
		if (!user) return done(null, false, { message: 'Incorrect password.' });
		// successful login
		return done(null, user);
    });
  });
}));

// passport sign up strategy
passport.use('signup', new LocalStrategy(
  function(username, password, done) {
	console.log("signup", username);
	
    db.get('SELECT salt FROM users WHERE username = ?', username, function(err, user) {
	// verify the username doesn't already exist
	if (user) return done(null, false, { message: 'Username already exists.' });
	// create password hash
	var salt = crypto.randomBytes(128).toString('base64');
	var hash = hashPassword(password, salt);

	// signup
	db.get('INSERT INTO users (id, username, password, salt) VALUES (NULL, ? , ? , ? );', username, hash, salt, function(err, user) {
		db.get('SELECT * FROM users WHERE username = ?', username, function(err, newUser) {
			return done(null, newUser);
		});
	});
  });
}));

// login
app.post('/login', function(req, res, next) {
	console.log("trying to login");
	passport.authenticate('login', function(err, user, info) {
		if (!user) { return res.sendStatus(401); }
		req.session.user = user;
		req.login(user, function(err) {
			
		});
		console.log('login successful');
		return res.sendStatus(200);
	})(req, res, next);
});

// signup
app.post('/signup', function(req, res, next) { 
	console.log("trying to sign up");
	passport.authenticate('signup', function(err, user, info) {
		if (!user) { return res.sendStatus(401); }
		console.log("signup successful");
		return res.sendStatus(200);
	})(req, res, next);
});

// logout
app.post('/logout', function(req, res) {
	console.log("trying to log out");
	req.logout();
	res.sendStatus(200);
	//res.redirect('/');
});

// exit
app.post('/exit', function(req, res, next) {
	console.log('exit');
	process.exit();
});

// upload model
app.post('/upload', function(req, res) {
	var username = req.session.user.username;
	var model_name = req.body.model_name;
	var model_json = req.body.model_json;
	
	// save the model to file
	var filename = uniqueFilename('', 'model');
	var file_path = path.join(models_root, filename);
	console.log(file_path);
	fs.writeFile(file_path, model_json, function(err) {
		if(err) {
			return console.log(err);
		}
	}); 
	
	// store a record for the model
	db.get('INSERT INTO models (id, owner_username, name, description, json_state, stars) VALUES (NULL, ? , ? , ? , ? , ? );', 
			username, model_name, "", filename, 0, function(err, row) {
		if (!err) {
			console.log(username + ' saved model ' + model_name + ' to ' + file_path);
		}
	});
});

// check if loggedin
app.get('/loggedin', function(req, res) {
	console.log(req.session);
	res.send(req.isAuthenticated() ? req.user : '0'); 
});

// serve index
app.use('/', function(req, res) {
	res.sendFile(path.join(root, 'home.html'));
	console.log(new Date());
});

// initialize server				
app.listen(3001, function () {
	console.log("Server up and running");
})

