(function() {
    var BOARD = {
        SIZE : { x : 9, y : 8}
    };

    var SELECTED_PIECE;

    var turn;

    var init = function(side) {
        constructBoard(side);
        constructPieces(side);
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

    var constructPieces = function(color) {
        var pieces = [
            {rank: "Spy", count: 2},
            {rank: "General 5", count: 1},
            {rank: "General 4", count: 1},
            {rank: "General 3", count: 1},
            {rank: "General 2", count: 1},
            {rank: "General 1", count: 1},
            {rank: "Colonel", count: 1},
            {rank: "Lt. Colonel", count: 1},
            {rank: "Major", count: 1},
            {rank: "Captain", count: 1},
            {rank: "1st Lieutenant", count: 1},
            {rank: "2nd Lieutenant", count: 1},
            {rank: "Sergeant", count: 1},
            {rank: "Private", count: 6},
            {rank: "Flag", count: 1}
        ];

        var x = (color == "white") ? 0 : BOARD.SIZE.x-1,
            y = (color == "white") ? 0 : BOARD.SIZE.y-1;
        for (var i = 0; i < pieces.length; i++) {
            var piece = pieces[i];
            for (var c = 0; c < piece.count; c++) {
                var html = "<div class='piece " + color + "'>" + piece.rank + "</div>";
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
            init(data.side);
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