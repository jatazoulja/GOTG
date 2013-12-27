(function() {
    var BOARD = {
        SIZE : { x : 9, y : 8},
        PIECES : [
            {rank: 1, name: "Spy"},
            {rank: 1, name: "Spy"},
            {rank: 2, name: "General 5"},
            {rank: 3, name: "General 4"},
            {rank: 4, name: "General 3"},
            {rank: 5, name: "General 2"},
            {rank: 6, name: "General 1"},
            {rank: 7, name: "Colonel"},
            {rank: 8, name: "Lt. Colonel"},
            {rank: 9, name: "Major"},
            {rank: 10, name: "Captain"},
            {rank: 11, name: "1st Lieutenant"},
            {rank: 12, name: "2nd Lieutenant"},
            {rank: 13, name: "Sergeant"},
            {rank: 14, name: "Private"},
            {rank: 14, name: "Private"},
            {rank: 14, name: "Private"},
            {rank: 14, name: "Private"},
            {rank: 14, name: "Private"},
            {rank: 14, name: "Private"},
            {rank: 15, name: "Flag"}
        ]
    };

    var SELECTED_PIECE;

    var turn;

    var init = function(side, socket) {
        constructBoard(side);
        constructPieces(BOARD.PIECES, side);

        $('#readyBtn').click(function() {
            var pieces = $('.piece.' + side);
            if (pieces && pieces.length > 0) {
                var data = [];
                for (var i = 0; i < pieces.length; i++) {
                    var pObj = $(pieces[i]);
                    var index = pObj.parent().attr('id').split('_');
                    data.push({rank: pObj.attr('rank'), pos: {x: index[0],y: index[1]}});
                }
                socket.emit("server.place", {pieces: data});
            }
        });
    };

    var constructBoard = function(side) {
        var html = "";
        var reverse = (side == "white") ? true : false;
        for (var j = 0; j < BOARD.SIZE.y; j++) {
            var y = (reverse) ? (BOARD.SIZE.y - (j+1)) : j;
            html += (y < 4) ? "<div class='row white'>" : "<div class='row black'>";
            for (var i = 0; i < BOARD.SIZE.x; i++) {
                var x = (reverse) ? (BOARD.SIZE.x - (i+1)) : i;
                var id = x + "_" + y;
                html += "<div class='block' id='" + id + "'></div>";
            }
            html += "</div>";
        }
        $("#board").html(html);

        $("#board .block").click(function() {
            // this block must be empty
            var block = $(this);
            if (block.find(".piece").length == 0) {
                if (SELECTED_PIECE) {
                    var selected = SELECTED_PIECE.remove();
                    block.append(selected);
                    // deselect
                    SELECTED_PIECE.removeClass("selected");
                    SELECTED_PIECE = null;
                }
            }
        });
    };

    var constructPieces = function(pieces, color) {
        var x = (color == "white") ? 0 : BOARD.SIZE.x-1,
            y = (color == "white") ? 0 : BOARD.SIZE.y-1;
        for (var i = 0; i < pieces.length; i++) {
            var piece = pieces[i];
            var html = "<div class='piece " + color + "' rank='" + piece.rank + "'>" + piece.name + "</div>";
            var id = x + "_" + y;
            $('#' + id).html(html);
            if (color == "white") {
                if (++x > BOARD.SIZE.x-1) {
                    x=0;
                    y++;
                }
            } else {
                if (--x < 0) {
                    x = BOARD.SIZE.x-1;
                    y--;
                }
            }
        }

        $("#board .block").delegate(".piece." + color, "click", function() {
            if ($(this).hasClass(color)) {
                if (SELECTED_PIECE) {
                    // deselect it first
                    SELECTED_PIECE.removeClass("selected");
                }
                SELECTED_PIECE = $(this);
                SELECTED_PIECE.addClass("selected");
            }
        });
    };

    $(document).ready(function() {
        var socket = io.connect('http://localhost:8080');

        var id;

        socket.on('initClient', function (data) {
            id = data.id;
            console.log(data);
        });

        socket.on('games', function(data) {
            console.log("Number of games:" + data.games.length);
            var html = "";
            for (var x = 0; x < data.games.length; x++) {
                var game = data.games[x];
                console.log(game.id);
                html += "<option value='" + game.id + "'>" + game.name + "</option>";
            }

            $("#gamesList").html(html);
        });

        socket.on('system', function(data) {
            if (data.type == "status") {
                console.log(data.message);
            } else {
                if (data.success) {
                    console.log("game has started");
                } else {
                    console.log(data.message);
                }
            }
        });

        socket.on('gameReady', function(data) {
            init(data.side, socket);
        });

        socket.on('client.ready', function(data) {
            // TODO: this shouldn't be here!!!
            for (var i = 0; i < data.pieces.length; i++) {
                var piece = data.pieces[i];
                $('#'+piece.pos.x+'_'+piece.pos.y)
                    .html("<div class='piece " + data.color + "' rank='" + piece.rank + "'></div>");
            }
        });

        $("#listGamesBtn").on("click", function() {
            console.log("list the game");
            socket.emit('listGames');
        });

        $("#createGameBtn").on("click",function() {
            socket.emit('createGame', {name: 'game2', clientID: id});
        });

        $("#joinGame").on("click",function() {
            var gameID = $('#gamesList').find(":selected").val();
            console.log("selected game is "+ gameID);
            socket.emit('joinGame', {id: gameID, clientID: id});
        });
    });
})();