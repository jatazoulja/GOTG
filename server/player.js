(function() {
    Player = function(id, connection) {
        var _id = id,
            _con = connection,
            _opponent,
            _turn = false;

        return {
            getId: function () {
                return _id;
            },

            notify: function(evt, data) {
                _con.emit(evt, data);
            }
        };
    }
})();