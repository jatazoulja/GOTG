(function() {
    Player = function(id, connection, game) {
        var _id = id,
            _con = connection,
            _game = game,
            _opponent,
            _side,
            _turn = false;

        var __OBJ__ = {
            getId: function () {
                return _id;
            },

            getOpponent: function() {
                return _opponent;
            },

            getSide: function() {
                return _side;
            },

            getTurn: function() {
                return _turn;
            },

            notify: function(evt, data) {
                _con.emit(evt, data);
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
                if (_turn) {
                    _game.playerMoved(__OBJ__, move.from, move.to);
                } else {
                    // not this player's turn
                }
            });
            _con.on("server.place", function(data) {
                _game.playerPlace(__OBJ__, data.pieces);
            });
        };

        _initEvents();

        return __OBJ__;
    }
})();