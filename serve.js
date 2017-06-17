var express = require('express');
var crypto = require('crypto');
var sqlite3 = require('sqlite3');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var fs = require('fs');
var uniqueFilename = require('unique-filename');
var dataUriToBuffer = require('data-uri-to-buffer');
var util = require('util');

var root = path.join(__dirname, "../public_html");
var models_root = path.join(root, "models");
var db = new sqlite3.Database('/home/neuraliz/neuralizer/Neuralizer.db');

var log_file_path = path.join(__dirname, 'debug.log');
var log_file = fs.createWriteStream(log_file_path, {flags : 'a'});

// create a lock file
lockfile_exists = false;
if (fs.existsSync(log_file_path)) {
  var stats = fs.statSync(log_file_path);
  var mtime = new Date(util.inspect(stats.mtime));
  if (new Date() - mtime < 60 * 1000) {
  	console.log('lock file exists');
  	lockfile_exists = true;
  }
}


// redirect output to file
var log_stdout = process.stdout;
console.log = function(d) {
  if (!lockfile_exists) {
    log_file.write(new Date() + util.format(d) + '\n');
  }
  log_stdout.write(new Date() + util.format(d) + '\n');
};

// initialize app
app.use(cookieParser());
app.use(bodyParser.json({limit: '5mb'}));       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true,
  limit: '5mb'
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
	console.log(username, user, "user correct");
	if (!user) return done(null, false, { message: 'Incorrect username.' });
	console.log("user correct");
	// validate password
    var hash = hashPassword(password, user.salt);
    db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, function(err, user) {
		// Invalid password
		console.log("password check");
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
	
    db.get('SELECT salt FROM users WHERE username = "?"', username, function(err, user) {
	// verify the username doesn't already exist
	if (user) return done(null, false, { message: 'Username already exists.' });
	// create password hash
	var salt = crypto.randomBytes(128).toString('base64');
	var hash = hashPassword(password, salt);
	console.log("created password hash")
	
	// signup
	db.get('INSERT INTO users (id, username, password, salt, full_name, email, date) VALUES (NULL, ? , ? , ?, ?, ?, DateTime(\'now\') );',
		username, hash, salt, "", username, function(err, user) {
		db.get('SELECT * FROM users WHERE username = ?', username, function(err, newUser) {
			console.log("done")
			return done(null, newUser);
		});
	});
  });
}));

// login
app.post('/login', function(req, res, next) {
	console.log("trying to login");
	passport.authenticate('login', function(err, user, info) {
		console.log(user);
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
	fs.unlink(path.join(__dirname, 'neuralizer.lockfile'));
	process.exit();
});

// upload model
app.post('/upload', function(req, res) {
	var username = req.session.user.username;
	var model_name = req.body.model_name;
	var model_json = req.body.model_json;
	var model_image = req.body.model_image;

	console.log("trying to save model");
	// generate random path
	var filename = uniqueFilename('', 'model');
	var file_path = path.join(models_root, filename);

	// save model json to file
	fs.writeFile(file_path + '.json', model_json, function(err) {
		if(err) {
			return console.log(err);
		}
	}); 

	// save model image to file
	fs.writeFile(file_path + '.png', dataUriToBuffer(model_image), 'binary', function(err) {
		if(err) {
			return console.log(err);
		}
	}); 
	
	// store a record for the model
	db.get('INSERT INTO models (id, owner_username, name, description, json_state, date) VALUES (NULL, ? , ? , ? , ? , DATETIME("now"));',
			username, model_name, "", filename, function(err, row) {
		if (!err) {
			console.log(username + ' saved model ' + model_name + ' to ' + file_path);
			return res.send(true);
		}
		console.log(err);

	});
});

// get user models list
app.get('/mymodels', function(req, res) {
	var username = req.session.user.username;
	// store a record for the model
	db.all('SELECT * FROM models m LEFT JOIN (SELECT model_id, Count(*) AS stars FROM stars GROUP BY model_id) s ON m.id == s.model_id WHERE m.owner_username = ?;', username, function(err, row) {
		if (!err) {
			return res.send(row);
		}
		console.log('models request error');
	});
});

// remove user model
app.post('/remove_model', function(req, res) {
	var username = req.session.user.username;
	var id = req.body.model_id;
	console.log("removing model", id, username);
	
	// remove stored model files
	db.get('SELECT json_state FROM models WHERE owner_username = ? and id = ?;', username, id, function(err, row) {
		if (!err && row) {
			filename = row.json_state;
			fs.unlink(path.join(models_root, filename + '.png'), function() {});
			fs.unlink(path.join(models_root, filename + '.json'), function() {});
		}
	});
	
	// delete the model record
	db.get('DELETE FROM models WHERE owner_username = ? and id = ?;', username, id, function(err, row) {
		if (!err) {
			return res.send(true);
		}
		console.log('model remove error');
	});
});

// remove user model
app.post('/toggle_model_star', function(req, res) {
	var model_id = req.body.model_id;
    var user_id = req.session.user.id;

    db.get('SELECT * FROM stars WHERE model_id = ? and user_id = ?;', model_id, user_id, function(err, row) {
		if (!err && row) {
			// delete star record
            db.get('DELETE FROM stars WHERE model_id = ? and user_id = ?;', model_id, user_id, function(err, row) {
            	if (!err) {
                    return res.send(true);
				}
            });
		} else {
			// add star record
            db.get('INSERT INTO stars (id, model_id, user_id, date) VALUES (NULL, ? , ? , DateTime(\'now\'));', model_id, user_id, function(err, row) {
				if (!err) {
					return res.send(true);
				}
            });
		}
    });
});

// get user model
app.post('/get_model', function(req, res) {
	var json_state = req.body.json_state;
	console.log("get model", req.body);
	// get model json from file and send it to client
	fs.readFile(path.join(models_root, json_state + '.json'), 'utf8', function (err,data) {
	  if (err) {
		return console.log(err);
	  }
	  return res.send(data);
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
});

// initialize server				
app.listen(3001, function () {
	console.log("Server up and running");
})

