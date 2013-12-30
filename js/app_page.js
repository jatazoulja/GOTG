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

    var __color__,
        _moveNum = 0,
        __moveId__,
        yourTurn,
        state;

    var State = function() {
        this.con = undefined;
        this._extractCoordinates = function(block) {
            var index = $(block).attr('id').split('_');
            return {x: index[0], y: index[1]};
        };
        this.move = function(piece, toBlock) {};
    };

    State.SELECTED_PIECE = null;

    var GameReadyState =  function(socket) {
        this.con = socket;
        this.move = function(piece, toBlock) {
            var block = $(toBlock);
            if (block.find(".piece").length == 0) {
                if (piece) {
                    var selected = piece.remove();
                    block.append(selected);
                    // deselect
                    piece.removeClass("selected");
                    State.SELECTED_PIECE;
                }
            }
        }
    };
    GameReadyState.prototype = new State();

    var GameStartedState =  function(socket) {
        this.con = socket;
        this.move = function(piece, toBlock) {
            if (piece) {
                var from = this._extractCoordinates($(piece).parent());
                var to = this._extractCoordinates(toBlock);
                __moveId__ = __color__ + _moveNum++;
                // deselect
                piece.removeClass("selected");
                State.SELECTED_PIECE = null;
                this.con.emit("server.move", {from: from, to: to, moveId: __moveId__});
            }
        }
    }
    GameStartedState.prototype = new State();

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
            if (!_isWaiting()) {
                state.move(State.SELECTED_PIECE, this);
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

        $("#board .block").delegate(".piece." + color, "click", function(event) {
            event.stopPropagation();
            if ($(this).hasClass(color)) {
                if (State.SELECTED_PIECE) {
                    // deselect it first
                    State.SELECTED_PIECE.removeClass("selected");
                }
                State.SELECTED_PIECE = $(this);
                State.SELECTED_PIECE.addClass("selected");
            }
        });
    };

    var _isWaiting = function() {
        return (__moveId__) ? true : false;
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

        socket.on('game.ready', function(data) {
            state = new GameReadyState(socket);
            __color__ = data.side;
            init(__color__, socket);
        });

        socket.on('game.start', function(data) {
            state = new GameStartedState(socket);
        });

        socket.on('client.ready', function(data) {
            // TODO: this shouldn't be here!!!
            for (var i = 0; i < data.pieces.length; i++) {
                var piece = data.pieces[i];
                $('#'+piece.pos.x+'_'+piece.pos.y)
                    .html("<div class='piece " + data.color + "' rank='" + piece.rank + "'></div>");
            }
        });

        socket.on('client.move', function(data) {
            //data.turn;
            if (data.success) {
                for (var i = 0; i < data.actions.length; i++) {
                    var action = data.actions[i];
                    var type = action.action;
                    if (type == 'remove') {
                        var id = action.position.x + "_" + action.position.y;
                        $("#"+id).html("");
                    } else if (type == 'place') {
                        var fromId = action.from.x + "_" + action.from.y;
                        var toId = action.to.x + "_" + action.to.y;
                        var jFromObj = $("#"+fromId);

                        var rPiece = jFromObj.html();
                        jFromObj.html("");
                        $("#"+toId).html(rPiece);
                    } else if (type == 'finished') {
                        alert(action.winner + " has won!");
                    }
                }
            }
            if (data.moveId == __moveId__) {
                __moveId__ = null;
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