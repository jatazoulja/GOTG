var express = require("express"),
    app = new express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    connect = require('connect'),
    crypto = require('crypto'),
    uuid = require('node-uuid'),
    logger = io.log,
    _secretKey_ = 'a4f8071f-c873-4447-8ee2',
    cookieParser = express.cookieParser(_secretKey_);

require('./gameManager.js');
require('./game');
require('./player');
Util = require('util');
LOGGER = logger;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/db');

var SessionStore = require('express-sessions'),
    sessionStore = new SessionStore({
        storage: 'mongodb',
        instance: mongoose, // optional
        collection: 'sessions', // optional
        expire: 86400 // optional
    });

var Users = mongoose.model('users',
        new mongoose.Schema({
                _id: {type: String, index: true, required: true, unique: true},
                name: {type: String, index: true, required: true, unique: true},
                password: String}));

var __initUsers__ = function() {
    Users.find({name: "kenneth"}, function(err, doc) {
        logger.debug('FINDING USER ' + Util.inspect(doc, false, null));
        if (doc && doc.length == 0) {
            var pass = crypto.createHmac("sha1", _secretKey_).update('qwerty').digest("hex");

            var user = new Users({_id: uuid.v1(), name: "kenneth", password: pass});
            user.save(function(err, user, count) {
                if (err) {
                    logger.error('SAVING USER FAILED ' + err);
                }
                logger.info('SAVED USER count ' + count);
            });
        }
    });
}();

app.configure(function() {
    app.use(express.logger());
    app.use(connect.urlencoded());
    app.use(connect.json());
    app.use(cookieParser);
    app.use(express.session({
        secret: _secretKey_,
        //cookie: { maxAge: 2628000000 },
        store: sessionStore
    }));
});
app.get('/', function (req, res) {
    if (req.session.userId) {
        res.sendfile('app.html', {root: '../'});
    } else {
        res.sendfile('login.html', {root: '../'});
    }
});
app.post('/login', function (req, res) {
    var user = req.body['u'],
        pass = req.body['p'];

    authenticate(user, pass, function(err, userId) {
        if (userId) {
            req.session.userId = userId;
            res.redirect('/');
        } else {
            res.sendfile('login.html', {root: '../'});
        }
    });
});
app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            logger.log("Error logging out!");
            return;
        }
        res.cookie('connect.sid', '', {expires: new Date(1), path: '/'});
        res.sendfile('login.html', {root: '../'});
    });
});
app.get('/signup', function (req, res) {
    if (req.session) {
        req.session.destroy(function(err) {
            if (err) {
                logger.log("Error logging out!");
                return;
            }
            res.cookie('connect.sid', '', {expires: new Date(1), path: '/'});
            res.sendfile('signup.html', {root: '../'});
        });
    } else {
        res.sendfile('signup.html', {root: '../'});
    }
});
app.post('/doSignup', function (req, res) {
    var usename = req.body['u'],
        password = req.body['p'],
        confirmPass = req.body['cp'];

    if (!usename || !password || !confirmPass) {
        res.sendfile('signup.html', {root: '../'});
    } else if (password !== confirmPass) {
        res.sendfile('signup.html', {root: '../'});
    } else {
        Users.find({name: usename}, function(err, doc) {
            logger.debug('FINDING USER ' + Util.inspect(doc, false, null));
            if (doc && doc.length == 0) {
                var hashedPass = crypto.createHmac("sha1", _secretKey_).update(password).digest("hex");
                var user = new Users({_id: uuid.v1(), name: usename, password: hashedPass});
                user.save(function(err, user, count) {
                    if (err) {
                        logger.error('SAVING USER FAILED ' + err);
                        res.sendfile('signup.html', {root: '../'});
                    }
                    logger.info('SAVED USER count ' + count);
                    res.sendfile('login.html', {root: '../'});
                });
            } else {
                res.sendfile('signup.html', {root: '../'});
            }
        });
    }
});
app.get('/lib/*', function (req, res) {
    res.sendfile('lib/' + req.params[0], {root: '../'});
});
app.get('/css/*', function (req, res) {
    res.sendfile('css/' + req.params[0], {root: '../'});
});
app.get('/js/*', function (req, res) {
    res.sendfile('js/' + req.params[0], {root: '../'});
});

var authenticate = function(user, pass, cb) {
    cb = cb || function() {};
    var p = crypto.createHmac("sha1", _secretKey_).update(pass).digest("hex");

    Users.findOne({name: user}, function(err, doc) {
        if (doc && doc.password == p) {
            return cb(null, doc._id);
        }
        return cb('Invalid username of password', false);
    });
};

/*
    WebSocket code
 */
var getUserById = function(id, cb) {
    Users.findOne({_id: id}, function(err, doc) {
        if (!err) {
            return cb(null, doc);
        }
        return cb('Invalid userId', false);
    });
};

var SessionSockets = require('session.socket.io'),
    sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

sessionSockets.on('connection', function (err, socket, session) {
    if (!session && !session.userId) {
        LOGGER.debug('invalid session, force closing websocket');
        socket.disconnect();
        return;
    } else {
        getUserById(session.userId, function(err, user) {
            if (!err) {
                socket.set('user', {id: user._id, name: user.name}, function() {
                    socket.emit('initClient', { id: session.userId });
                });
            }
        });
    }

    socket.on('createGame', function (data) {
        socket.get('user', function(err, user) {
            if (!err) {
                var gameName = user.name;
                var game = GameManager.createGame(gameName);
                game.join(new Player(user.id, socket, game)); // join the create game requester automatically to the game
                socket.emit('system', {type: "status", message: "game created!"});
            }
        });
    });

    socket.on('listGames', function() {
        socket.emit('games', {games: GameManager.listGames()});
    });

    socket.on('joinGame', function (data) {
        logger.debug("evt.joinGame: " + data);
        var game = GameManager.getGame(data.id);

        if (game) {
            var player = new Player(data.clientID, socket, game);
            game.join(player);
        } else {
            logger.error("evt.joinGame: " + data.id + " not found");
        }
    });
});
server.listen(8080);
