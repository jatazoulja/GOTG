(function() {
    Player = function(id, connection, game) {
        var _id = id,
            _con = connection,
            _game = game;
            _opponent,
            _side,
            _turn = false;

        var _initEvents = function() {
            _con.on("move", function(move) {
                if (_turn) {
                    _game.playerMoved(move.from, move.to);
                } else {
                    // not this player's turn
                }
            });
        };

        _initEvents();

        return {
            getId: function () {
                return _id;
            },

            getSide: function() {
                return _side;
            },

            notify: function(evt, data) {
                _con.emit(evt, data);
            },

            setSide: function(side) {
                _side = side;
            }
        };
    }
})();