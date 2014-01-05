(function() {
    GameManager = {
        __games__: {},

        createGame: function(name) {
            var game = new Game(name);
            this.__games__[game.getId()] = game;
            return game;
        },

        listGames: function() {
            var list = [];
            for (var key in this.__games__) {
                var game = this.__games__[key];
                var details = {
                    id : game.getId(),
                    name: game.getName() + ' (' + ((game.getPlayers().length >= game.maxPlayers) ? 'FULL' : game.getPlayers().length) + ')'
                };
                list.push(details);
            }
            return list;
        },

        getGame: function(gameId) {
            return this.__games__[gameId];
        },

        removeGame: function(gameId) {
            delete this.__games__[gameId];
        }
    };
})();