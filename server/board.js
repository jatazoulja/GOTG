(function() {
    Board = function() {
        var X_AXIS_SIZE = 9,
            Y_AXIS_SIZE = 8;

        var VALID_PLACINGS = {
            white: {from: {x:0,y:0}, to: {x:X_AXIS_SIZE-1, y:2}},
            black: {from: {x:0,y:5}, to: {x:X_AXIS_SIZE-1, y:Y_AXIS_SIZE-1}}
        }

        var _board;
        (function _init() {
            _board = new Array(X_AXIS_SIZE);
            for (var x = 0; x < _board.length; x++) {
                _board[x] = new Array(Y_AXIS_SIZE);
            }
        })();

        var _validateMove = function(from, to) {
            if (to.x < 0 && to.x >= X_AXIS_SIZE && to.y < 0 && to.y >= Y_AXIS_SIZE) {
                return false;
            }
            if (to.x - from.x === -1 || to.x - from.x === 1) {
                return true;
            } else if (to.y - from.y === -1 || to.y - from.y === 1) {
                return true;
            }
            return false;
        };

        var _validatePlacing = function(x, y, color) {
            var validPlacing = VALID_PLACINGS[color];
            return x >= validPlacing.from.x && x <= validPlacing.to.x &&
                y >= validPlacing.from.y && y <= validPlacing.to.y;
        };

        return {
            maxX: X_AXIS_SIZE,
            maxY: Y_AXIS_SIZE,
            place: function(side, pieces) {
                for (var i = 0; i < pieces.length; i++) {
                    var p = pieces[i];
                    if (!_validatePlacing(p.pos.x, p.pos.y, side)) {
                        return false;
                    }
                    _board[p.pos.x][p.pos.y] = {rank: p.rank, color: side};
                    LOGGER.debug("Board.place: " + Util.inspect(p, false, null));
                    // TODO: should this be here???
                    p.rank = null;
                }
                LOGGER.debug("Board.place: board array has " + Util.inspect(_board, false, null));
                return true;
            },

            move: function(from, to) {
                var actions;
                var pieceToMove = _board[from.x][from.y];
                if (pieceToMove) {
                    if (_validateMove(from, to)) {
                        var piece = _board[to.x][to.y];
                        if (!piece) {
                            _board[to.x][to.y] = pieceToMove;
                            _board[from.x][from.y] = null;
                            // notify client
                            actions = [
                                {action : "place", from : from, to: to}
                            ];
                        } else {
                            // either same side's piece or opponent piece
                            if (piece.color != pieceToMove.color) {
                                // we have a clash here!!
                                if (piece.rank === pieceToMove.rank) {
                                    actions = [
                                        {action: 'remove', position: from},
                                        {action: 'remove', position: to}
                                    ];
                                    if (piece.rank == 15) {
                                        // both are flag, we had a draw
                                        actions.push({action: 'finished', winner: ''});
                                    }
                                    // both dead, remove them both
                                    _board[from.x][from.y] = null;
                                    _board[to.x][to.y] = null;
                                    // notify client

                                }
                                if (Board.PIECES[pieceToMove.rank].canKill.indexOf(parseInt(piece.rank)) > -1) {
                                    // player who moved won!
                                    actions = [
                                        {action: 'remove', position: to},
                                        {action: 'place', from: from, to: to}
                                    ];
                                    if (_board[to.x][to.y].rank == 15) {
                                        actions.push({action: 'finished', winner: _board[from.x][from.y].color});
                                    }
                                    _board[to.x][to.y] = _board[from.x][from.y];
                                    _board[from.x][from.y] = null;
                                } else {
                                    // player who moved lost!
                                    actions = [
                                        {action: "remove", position: from}
                                    ]
                                    if (_board[from.x][from.y].rank == 15) {
                                        actions.push({action: 'finished', winner: _board[to.x][to.y].color});
                                    }
                                    _board[from.x][from.y] = null;
                                    // notify client
                                }
                            } else {
                                // invalid move!
                                return false;
                            }
                        }
                        if (_board[to.x][to.y].rank == 15 && to.y == 0 && _board[to.x][to.y].color == 'black') {
                            // black won
                            actions.push({action: 'finished', winner: 'black'});
                        } else if (_board[to.x][to.y].rank == 15 && to.y == Y_AXIS_SIZE-1
                            && _board[to.x][to.y].color == 'white') {
                            // white won
                            actions.push({action: 'finished', winner: 'white'});
                        }
                        return actions;
                    } else {
                        // move is invalid
                        return false;
                    }
                } else {
                    // this piece is no longer there... player might be cheating!!
                    return false;
                }
            }
        }
    };

    Board.PIECES = {
        '1' : {name: "Spy", canKill: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ,13, 15]},
        '2' : {name: "General 5", canKill: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ,13, 14, 15]},
        '3' : {name: "General 4", canKill: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ,13, 14, 15]},
        '4' : {name: "General 3", canKill: [4, 5, 6, 7, 8, 9, 10, 11, 12 ,13, 14, 15]},
        '5' : {name: "General 2", canKill: [5, 6, 7, 8, 9, 10, 11, 12 ,13, 14, 15]},
        '6' : {name: "General 1", canKill: [6, 7, 8, 9, 10, 11, 12 ,13, 14, 15]},
        '7' : {name: "Colonel", canKill: [7, 8, 9, 10, 11, 12 ,13, 14, 15]},
        '8' : {name: "Lt. Colonel", canKill: [8, 9, 10, 11, 12 ,13, 14, 15]},
        '9' : {name: "Major", canKill: [9, 10, 11, 12 ,13, 14, 15]},
        '10' : {name: "Captain", canKill: [10, 11, 12 ,13, 14, 15]},
        '11' : {name: "1st Lieutenant", canKill: [11, 12 ,13, 14, 15]},
        '12' : {name: "2nd Lieutenant", canKill: [12 ,13, 14, 15]},
        '13' : {name: "Sergeant", canKill: [13, 14, 15]},
        '14' : {name: "Private", canKill: [14, 15, 1]},
        '15' : {name: "Flag", canKill: [15]}
    }
})();