(function() {
    Board = function() {
        var X_AXIS_SIZE = 9,
            Y_AXIS_SIZE = 8;

        var _board;
        (function _init() {
            _board = new Array(X_AXIS_SIZE);
            for (var x = 0; x < _board.length; x++) {
                _board[x] = new Array(Y_AXIS_SIZE);
            }
        })();
    }
})();