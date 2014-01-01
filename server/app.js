var express = require("express"),
    app = new express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    connect = require('connect');

require('./game');
require('./player');
Util = require('util');

var __VALID_USERS__ = {
    'kenneth': 'qwerty'
};

var MemoryStore = express.session.MemoryStore,
    sessionStore = new MemoryStore();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/db');

app.configure(function() {
    sessionStore = new (require('express-sessions'))({
        storage: 'mongodb',
        instance: mongoose, // optional
        collection: 'sessions', // optional
        expire: 86400 // optional
    });

    app.use(connect.urlencoded());
    app.use(connect.json());
    //app.use(express.bodyParser());
    app.use(express.cookieParser());
    //app.use(express.session({secret: '1234567890QWERTY'}));
//    app.use(express.session({
//        store: sessionStore,
//        secret: '1234567890QWERTY',
//        key: 'express.sid'
//    }));
    app.use(express.session({
        secret: 'a4f8071f-c873-4447-8ee2',
        cookie: { maxAge: 2628000000 },
        store: sessionStore
    }));
});

app.get('/', function (req, res) {
    if (req.session.user) {
        res.sendfile('app.html', {root: '../'});
    } else {
        res.sendfile('login.html', {root: '../'});
    }
});

app.post('/login', function (req, res) {
    var user = req.body['u'],
        pass = req.body['p'];

    if (__VALID_USERS__[user] && __VALID_USERS__[user] == pass) {
        req.session.user = user;
        res.redirect('/');
    } else {
        res.sendfile('login.html', {root: '../'});
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
                if (session && session.user) {
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
//http.createServer(app).listen(80);
