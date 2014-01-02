var express = require("express"),
    app = new express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    connect = require('connect'),
    crypto = require('crypto'),
    uuid = require('node-uuid');

require('./game');
require('./player');
Util = require('util');

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
                name: String,
                password: String}));

var __initUsers__ = function() {
    Users.find({name: "kenneth"}, function(err, doc) {
        console.info('FINDING USER ' + Util.inspect(doc, false, null));
        if (doc && doc.length == 0) {
            var pass = crypto.createHmac("sha1", '1234567890QWERTY').update('qwerty').digest("hex");

            var user = new Users({_id: uuid.v1(), name: "kenneth", password: pass});
            user.save(function(err, user, count) {
                if (err) {
                    console.error('SAVING USER FAILED ' + err);
                }
                console.info('SAVED USER count ' + count);
            });
        }
    });
}();

app.configure(function() {
    app.use(connect.urlencoded());
    app.use(connect.json());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: 'a4f8071f-c873-4447-8ee2',
        cookie: { maxAge: 2628000000 },
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
            console.log("Error logging out!");
            return;
        }
        res.cookie('connect.sid', '', {expires: new Date(1), path: '/'});
        res.sendfile('login.html', {root: '../'});
    });
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
    var crypto = require('crypto');
    var p = crypto.createHmac("sha1", '1234567890QWERTY').update(pass).digest("hex");

    Users.findOne({name: user}, function(err, doc) {
        if (doc && doc.password == p) {
            return cb(null, doc._id);
        }
        return cb('Invalid username of password', false);
    });
}

/*
    WebSocket code
 */
var clientIdCounter = 0;
var games = {};
var clients = [];

io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
        var cName = 'connect.sid';
        var regex = new RegExp(cName + '=([^;]*)', 'g');
        var result = regex.exec(data.headers.cookie);
        var sessionID = result[1].split('.')[0].replace('s%3A', "");

        sessionStore.get(sessionID, function (err, session) {
            if (err) {
                accept(err.message, false); //Turn down the connection
            } else {
                if (session && session.userId) {
                    accept(null, true); //Accept the session
                } else {
                    accept("No username in session", false); //Turn down the connection
                }
            }
        });
    } else {
        accept('No cookie transmitted.', false);
    }
});

io.sockets.on('connection', function (socket) {

    socket.emit('initClient', { id: clientIdCounter++ });

    socket.on('createGame', function (data) {
        var gameName = data.name;
        var game = new Game(gameName);
        var player = new Player(data.clientID, socket, game);
        game.join(player); // join the create game requester automatically to the game
        games[game.getId()] = game;
        socket.emit('system', {type: "status", message: "game created!"});
    });

    socket.on('listGames', function() {
        var list = [];
        for (var key in games) {
            var game = games[key];
            var details = {
                id : game.getId(),
                name: game.getName()
            }
            list.push(details);
        }
        socket.emit('games', {games: list});
    });

    socket.on('joinGame', function (data) {
        console.log("evt.joinGame: " + data);
        var game = games[data.id];

        if (game) {
            var player = new Player(data.clientID, socket, game);
            game.join(player);
        } else {
            console.log("evt.joinGame: " + data.id + " not found");
        }
    });
});
server.listen(8080);
