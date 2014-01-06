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
            },

            destroy: function() {
                _removeEvents();
                _game = null;
                _con = null;
            }
        };

        var __EVENTS__ = {
            'server.move': {
                fn: function(move) {
                    if (_game.hasStarted()) {
                        if (_turn) {
                            _game.playerMoved(THIS, move.moveId, move.from, move.to);
                        } else {
                            // not this player's turn
                            //_game.playerMoved(THIS, move.moveId, null, null);
                            THIS.notify("client.move", {success: false, desc: "Not your turn",
                                moveId: move.moveId, turn: THIS.turn()});
                        }
                    } else {
                        // game has not started yet
                    }
                }
            },
            "server.place": {
                fn: function(data) {
                    if (!_game.hasStarted() && _game.isReady()) {
                        _game.playerPlace(THIS, data.pieces);
                    } else {
                        // game has not started yet
                    }
                }
            },
            'disconnect': {
                fn: function() {
                    LOGGER.info("Client with id " + _id + " has been disconnected");
                    _game.playerDisconnected(THIS);
                }
            }
        };

        var _initEvents = function() {
            for (var key in __EVENTS__) {
                _con.on(key, __EVENTS__[key].fn);
            }
        };

        var _removeEvents = function() {
            for (var key in __EVENTS__) {
                _con.removeListener(key, __EVENTS__[key].fn);
            }
        };

        _initEvents();

        return THIS;
    }
})();