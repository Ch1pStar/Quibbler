var Event = require('../../lib/event.js');
var Player = require('./player.js');
var WebSocketServer = require('ws').Server;
var AIPlayer = require('./aiplayer.js');
var consts = require('../../lib/const.js');

function PlayerSystem(config) {
	this.id = config.id;

	this.parent = config.parent;

	this.name = 'player-system';
	this.outPort = config.port;
	this.players = [];
	this.pId = 0;
	this.subscribedEvents = {};

	this.subscribedEvents[consts.EVENT_ACTION.PRODUCE] = function(e){
		e.canPropagate = false;
		//TMP
		this.broadcastToPlayers(e);
	}

	this.subscribedEvents[consts.EVENT_OUTGOING.FLUSH_PLAYER_MESSAGES] = function(e){
		this.flushOutgoingPlayerMessages();
	}

	this.wss = new WebSocketServer({port:this.outPort});

	var self = this;
	this.wss.on('connection', function(ws){
		self.onConnect(ws);
	});

	this.startOutgoingMessageInterval();

};

PlayerSystem.prototype.startOutgoingMessageInterval = function () {

	var self = this;
	setInterval(function(){
		var updatedUnits = [];
		for(var i in self.players){
			updatedUnits[i] = [];
		}

		for(var i in self.parent.es.entities){
			var currEntity = self.parent.es.entities[i];
			if(currEntity.stateChanged){
				for(var p in currEntity.seenBy){
					var playerId = currEntity.seenBy[p];
					var netAttributes = currEntity.getNetworkAttributes();
					for(var k in netAttributes){
						updatedUnits[playerId].push(netAttributes[k]);
					}
				}
				currEntity.stateChanged = false;
			}
		}
		for(var i in updatedUnits){
			if(updatedUnits[i].length>0){
				var e = new Event(consts.EVENT_ACTION.ENTITY_STATE_UPDATE, {}, updatedUnits[i]);
				var player = self.players[i];
				if(!player.isAI){
					player.outgoingMessages.push(e);
				}
			}
		}
		self.flushOutgoingPlayerMessages();
	},this.parent.tickRate*this.parent.playersUpdateInterval);
};

PlayerSystem.prototype.broadcastToPlayers = function (e) {
	for(var p in this.players){
		var currPlayer = this.players[p];
		if(!currPlayer.isAI){
			currPlayer.outgoingMessages.push(e);
		}
	}
};

PlayerSystem.prototype.addAI = function () {
		var id = this.pId++;
		var ai = new AIPlayer(id, this);
		this.players[id] = ai;

		var e = new Event(consts.EVENT_ACTION.AI_PLAYER_ADDED, {id:this.id, name:this.name},ai);
		this.eventBroadcast(e);

	  ai.spawnOrder([308,308,10]);

};

PlayerSystem.prototype.flushOutgoingPlayerMessages = function () {
	for (var i = 0; i < this.players.length; i++) {
		var currPlayer = this.players[i];
		if(!currPlayer.isAI && currPlayer.connected){
			currPlayer.flushOutgoingMessages();
		}
	}
};

PlayerSystem.prototype.onConnect = function(ws) {
	var id = this.pId++;
	var p = new Player(id, ws, this);
	this.players[id] = p;
	var e = new Event(consts.EVENT_ACTION.PLAYER_CONNECTED, {id:this.id, name:this.name},{id:id});
	this.eventBroadcast(e);

	this.sendWelcomeMessageToPlayer(p);
	this.sendCurrentStateToPlayer(p);
};

PlayerSystem.prototype.sendCurrentStateToPlayer = function(p){
	for(var i in this.parent.es.entities){
		var entity = this.parent.es.entities[i];
		var data = entity.getInitialNetworkAttributes();
		var entityProduceEvent = new Event(consts.EVENT_ACTION.PRODUCE, {}, data);
		p.outgoingMessages.push(entityProduceEvent);
	}
};

PlayerSystem.prototype.sendWelcomeMessageToPlayer = function (p) {
	var we = new Event(consts.EVENT_ACTION.PLAYER_CONNECTED,{},[this.parent.tick, this.parent.tickRate, this.parent.playersUpdateInterval]);
	p.outgoingMessages.push(we);
};

PlayerSystem.prototype.setEventBroadcast = function(cb) {
	this.eventBroadcast = cb;

	//
	this.addAI();
};

PlayerSystem.prototype.getSubscribedEvents = function() {
	return this.subscribedEvents;
};

module.exports = PlayerSystem;
