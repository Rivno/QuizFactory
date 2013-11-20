var http = require('http');
var express = require('express');
var app = express();

// all environments
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

var htmlMapRoute = require('./commons/htmlMapRoute');
var gameControllerModule = require('./controllers/gameController');
var gameEngine = require('./engines/gameEngine');
var gameController = new gameControllerModule.gameController();
htmlMapRoute.map(app, [gameController]);
app.get('/', gameController.index);
app.use(express.static('./public'));

var server = http.createServer(app);


var io = require('socket.io').listen(server);


server.listen(process.env.port, function(){
  console.log('Express server listening on port ' + process.env.port);
});

gameEngine.start(io);