function guid() {
    var S4 = function (){
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

var playerObject = function () {
    var self = this;

    self.guid = null;
    self.pseudo = null;
    self.message = null;
    self.score = ko.observable(0);
}

var mainViewModel = function () {
    var self = this;

    /* Private */
    var socket = null;

    var win = function () {
        self.player.message = " a trouvé(e) la réponse. (" + self.currentQuiz().score  + " points)";

        socket.emit('playerWin', ko.toJS(self.player));
        
        self.logs.push(self.player);
    }

    var getAllQuiz = function (data) {
        self.logs(data.logs);

        if (data.isStart === true && (data.currentQuiz != undefined || data.currentQuiz != null)) {
            self.isReady(true);
            self.isStart(data.isStart);
            self.currentQuiz(data.currentQuiz);
        }
        else if (data.isStart === true) {
            self.isReady(true);
            self.showTimer(true);
            setTimeout(timer, 1000);
        }        

        for (var index in data.listPlayer) {

            var player = data.listPlayer[index];
            var newPlayer = new playerObject();

            newPlayer.guid = player.guid;
            newPlayer.pseudo = player.pseudo;
            newPlayer.score(player.score);
            self.listPlayer.push(newPlayer);
        }
    }

    var next = function (quiz) {        
        if (quiz.isFinish) {
            self.isFinish(true);
        }
        else {
            self.currentQuiz(quiz);
        }

        if (self.isStart() == false && self.showTimer() == true) {
            self.isStart(true);
            self.showTimer(false);
        }
    }

    var playerWin = function (player) {
        var existPlayer = ko.utils.arrayFilter(self.listPlayer(), function(p) {
            return p.guid === player.guid;
        })[0];

        if (!existPlayer) {
            existPlayer = new playerObject();
            existPlayer.guid = player.guid;
            existPlayer.pseudo = player.pseudo;
            self.listPlayer.push(existPlayer);
        }

        existPlayer.score(player.score);
        self.logs.push(player);
    }

    var newPlayer = function (player) {
        existPlayer = new playerObject();
        existPlayer.guid = player.guid;
        existPlayer.pseudo = player.pseudo;
        existPlayer.score(player.score);
        self.listPlayer.push(existPlayer);
        self.logs.push(player);
    }

    var timer = function () {
        self.timer(self.timer() - 1);

        if (self.timer() > 0) {
            setTimeout(timer, 1000);
        }
    }

    var start = function (showTimer) {
        self.showTimer(true);
        setTimeout(timer, 1000);
    }
    /* Private End */

    /* Public */
    self.isReady = ko.observable(false);
    self.isStart = ko.observable(false);
    self.isFinish = ko.observable(false);
    self.showTimer = ko.observable(false);
    self.isPseudoSet = ko.observable(false);
    self.logs = ko.observableArray([]);
    self.listPlayer = ko.observableArray([]);
    self.cListPlayer = ko.computed(function () {
        return self.listPlayer().sort(function(left, right) { 
            return left.score() == right.score() ? 0 : (left.score() > right.score() ? -1 : 1) 
        })
    });
    self.timer = ko.observable(10);
    self.currentQuiz = ko.observable();
    self.response = ko.observable();
    self.pseudo = ko.observable('Utilisateur');
    self.winner = ko.computed(function () {
        return self.cListPlayer()[0];
    });
    self.player = new playerObject();

    self.onKeyUpPseudo = function (data, event) {
        if (event.keyCode == 13) {
            self.setPseudo();
        }
    }
    
    self.ready = function () {
        self.isReady(true);
        socket.emit('ready', ko.toJS(self.player));
    }

    self.setPseudo = function () {
        self.player.guid = guid();
        self.player.pseudo = self.pseudo();
        self.listPlayer.push(self.player);
        self.isPseudoSet(true);

        // On se connecte au serveur
        socket = io.connect();

        // On creer l'evenement recupererMessages pour recuperer direcement les messages sur serveur
        socket.on('getAllQuiz', getAllQuiz);
        socket.on('playerWin', playerWin);
        socket.on('newPlayer', newPlayer);
        socket.on('next', next);
        socket.on('start', start);

        self.player.message = " est connecté(e).";
        socket.emit('newParty', true);
        socket.emit('newPlayer', ko.toJS(self.player));
    }

    self.newParty = function () {
        socket.emit('newParty', true);

        self.listPlayer.removeAll();
        self.logs.removeAll();
        self.player.score(0);
        self.timer(10);
        self.isReady(false);
        self.isStart(false);
        self.isFinish(false);
        self.showTimer(false);
        self.listPlayer.push(self.player);

        self.player.message = " est connecté(e).";
        socket.emit('newPlayer', ko.toJS(self.player));
    }

    self.onKeyUpWin = function (data, event) {
        if (event.keyCode == 13) {
            self.checkResponse();
        }
    }

    self.checkResponse = function () {
        
        if (self.response().toUpperCase() == self.currentQuiz().response.toUpperCase())
        {
            self.player.score(self.player.score() + self.currentQuiz().score);
            win();
        }

        self.response("");
    }
    /* Public End */
}