var fs = require('fs');

exports.gameController = function(schemaName) {
    var _schemaName = schemaName;

    this.name = "game";

    this.index = function(req, res) {

        fs.readFile('./public/views/game/index.html', 'utf-8', function(error, content) {
            res.writeHead(200, {'Content-Type' : 'text/html'});
            res.end(content);
        });
    };
};
