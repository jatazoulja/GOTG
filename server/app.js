var app = require("express"),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

require('./game');
require('./player');

//app.get('/', function (req, res) {
//  res.sendfile(__dirname + '/index.html');
//});

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
            var player = new Player(data.clientID, socket);
            game.join(player);
        } else {
            console.log("evt.joinGame: " + data.id + " not found");
        }
    });
});

server.listen(8080);
