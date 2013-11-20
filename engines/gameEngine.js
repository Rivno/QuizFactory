var http = require('http');

exports.start = function(io) {
	var listPlayer = {};
	var logs = [];
	var index = 0;
	var max = 10;
	var listQuiz = [];
	var currentQuiz = null;
	var isStart = false;
	var partyName = null;

	Array.prototype.shuffle = function(size) {
	    var s = [];

	    while (this.length && s.length < size) { 
	        s.push(this.splice(Math.random() * this.length, 1)[0]);
	    }

	    return s;
	}

	// Quand une personne se connecte au serveur
	io.sockets.on('connection', function (socket) {
		var currentPartyName = null;

	    var getQuizList = function () {
	        var options = {
	            hostname: 'abidbolfacts.azurewebsites.net'
	            , port: 80
	            , path: '/Quote'
	            , method: 'GET'
	        }

	        var req = http.get(options, function(res) {
	            var strData = '';

	            res.on('data', function (chunk) {
	                strData += chunk;
	            });

	            res.on('end', function() {
	                var jsData = JSON.parse(strData);
	                var dataResult = jsData.data;
	                listQuiz = [];
	                for (var quoteIndex in dataResult) {
	                    var quoteMg = dataResult[quoteIndex];
	                    if (typeof quoteMg === 'object') {
	                        listQuiz.push( 
	                        	{ question : quoteMg.quote
	                        		, response : quoteMg.actor.firstName + " " + quoteMg.actor.lastName
	                        		, score : 10 
	                        });
	                    }
	                }

	                listQuiz = listQuiz.shuffle(10);
	                index = 0;

	                setTimeout(function () {
	                	currentQuiz = listQuiz[index];
	                    socket.emit('next', currentQuiz);
	                    socket.broadcast.to(currentPartyName).emit('next', currentQuiz);
	                }, 10000);
	            });
	        });
	    };

	    socket.on('newParty', function () {
			socket.leave(currentPartyName);
			currentPartyName = partyName;
			socket.join(currentPartyName);
			socket.emit('getAllQuiz', 
		    	{ listPlayer: listPlayer
	                , logs: logs
	                , isStart: isStart
	                , currentQuiz: currentQuiz 
        	});
	    });

	    socket.on('newPlayer', function (player) {
	        listPlayer[player.guid] = player;
	        player.ready = false;
	        logs.push(player);

	        if (isStart === true) {
	        	console.log('plop');
	        	player.ready = true;
	        }

	        socket.broadcast.to(currentPartyName).emit('newPlayer', player);
	    });

	    socket.on('ready', function (player) {
	        var existPlayer = listPlayer[player.guid];

	        if (existPlayer) {
	           existPlayer.ready = true;
	        }

	        var isAllReady = true;

	        for (var p in listPlayer) {

	        	console.log(listPlayer[p].pseudo + ' ready : ' + listPlayer[p].ready);
	            isAllReady = listPlayer[p].ready;
	            if (isAllReady === false) {
	            	break;
	            }
	        }

	        if (isAllReady === true) {
	        	isStart = true;
	            socket.emit('start', true);
	            socket.broadcast.to(currentPartyName).emit('start', true);
	            getQuizList();
	        }
	    });

	    socket.on('playerWin', function (player) {
	        var existPlayer = listPlayer[player.guid];

	        if (existPlayer) {
	           existPlayer.score = player.score;
	        }

	        logs.push(player);

	        index++;
	        currentQuiz = listQuiz[index];

	        if (index >= max) {
	            currentQuiz = { isFinish : true };
	        }

	        socket.emit('next', currentQuiz);
	        socket.broadcast.to(currentPartyName).emit('next', currentQuiz);
	        socket.broadcast.to(currentPartyName).emit('playerWin', player);

	        if (index >= max) {
	            listPlayer = {};
				logs = [];
				index = 0;
				max = 10;
				listQuiz = [];
				currentQuiz = null;
				isStart = false;
				partyName = 'quiz' + (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	        }
	    });
	});
};