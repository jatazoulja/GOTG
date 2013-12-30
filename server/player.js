(function() {
    Player = function(id, connection, game) {
        var _id = id,
            _con = connection,
            _game = game,
            _opponent,
            _side,
            _ready = false,
            _turn = false;

        var THIS = {
            getId: function () {
                return _id;
            },

            getOpponent: function() {
                return _opponent;
            },

            getSide: function() {
                return _side;
            },

            turn: function() {
                return _turn;
            },

            isReady: function() {
                return _ready;
            },

            notify: function(evt, data) {
                _con.emit(evt, data);
            },

            ready: function() {
                _ready = true;
            },

            setOpponent: function(player) {
                _opponent = player;
            },

            setSide: function(side) {
                _side = side;
                if (side == "white") {
                    this.toggleTurn();
                }
            },

            toggleTurn: function() {
                _turn = (_turn) ? false : true;
            }
        };

        var _initEvents = function() {
            _con.on("server.move", function(move) {
                if (_game.hasStarted()) {
                    if (_turn) {
                        _game.playerMoved(THIS, move.moveId, move.from, move.to);
                    } else {
                        // not this player's turn
                    }
                } else {
                    // game has not started yet
                }
            });
            _con.on("server.place", function(data) {
                if (!_game.hasStarted()) {
                    _game.playerPlace(THIS, data.pieces);
                } else {
                    // game has not started yet
                }
            });
            _con.on("disconnect", function() {
                console.info("Client with id " + _id + " has been disconnected");
            });
        };

        _initEvents();

        return THIS;
    }
})();