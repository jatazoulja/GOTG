var express = require("express"),
    app = new express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

require('./game');
require('./player');
Util = require('util');

app.get('/', function (req, res) {
    res.sendfile('app.html', {root: '../'});
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
