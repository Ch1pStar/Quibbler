var Event = require("../../lib/event.js");
var Player = require("./player.js");
var WebSocketServer = require("ws").Server;
var AIPlayer = require("./aiplayer.js");
var consts = require("../../lib/const.js");

function PlayerSystem(config) {
	this.id = config.id;
	this.outgoingPlayerMessageLimit = config.outgoingPlayerMessageLimit;

	this.core = config.parent;

	this.name = "player-system";
	this.outPort = config.port;
	this.players = [];
	this.pId = 0;
  this.coreEDId = this.core.eventDispatcher.id;
  this.subscribedEvents = {};
  this.subscribedEvents[this.coreEDId] = {};

	this.subscribedEvents[this.coreEDId][consts.EVENT_ACTION.PRODUCE] = function(e){
		e.canPropagate = false;
		//TMP
		this.broadcastToPlayers(e);
	}

	this.subscribedEvents[this.coreEDId][consts.EVENT_OUTGOING.FLUSH_PLAYER_MESSAGES] = function(e){
		this.flushOutgoingPlayerMessages();
	}

  this.subscribedEvents[this.coreEDId][consts.EVENT_PLAYER_COMMAND.GLOBAL_ABILITY] = this.abilityCommandListener;

  this.subscribedEvents[this.coreEDId][consts.EVENT_PLAYER_COMMAND.SELECTION] = this.updatePlayerSelection;


	this.wss = new WebSocketServer({port:this.outPort});

	var self = this;
	this.wss.on('connection', function(ws){
		self.onConnect(ws);
	});

	this.startOutgoingMessageInterval();

};

PlayerSystem.prototype.updatePlayerSelection = function(e) {
	var player = e.creator;
	player.selection = [];
	for (var i = 0; i < e.data.length; i++) {
		var ent = this.core.es.entities[e.data[i]];
		if(ent!= null){
			player.selection.push(ent);
		}
	};
};

PlayerSystem.prototype.abilityCommandListener = function(e) {
	var player = e.creator;

	player.addAbilityCommand(e.data);	

};

PlayerSystem.prototype.update = function() {
	for(var i in this.players){
		var p = this.players[i];
		p.update();
	}

};

PlayerSystem.prototype.startOutgoingMessageInterval = function () {

	var self = this;
	setInterval(function(){
		var updatedUnits = [];
		for(var i in self.players){
			updatedUnits[i] = [];
		}

		var entities = self.core.es.getActiveEntities();
		for(var i in entities){
			var currEntity = entities[i];
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
	},this.core.tickRate*this.core.playersUpdateInterval);
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

  	ai.spawnOrder([2, 1, 10]);

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
	p.addGlobalAbility('spawn-entity');
	p.addGlobalAbility('clear-entity');
	var e = new Event(consts.EVENT_ACTION.PLAYER_CONNECTED, {id:this.id, name:this.name},{id:id}, false);
	this.eventBroadcast(e);
	this.broadcastToPlayers(e);

	this.sendWelcomeMessageToPlayer(p);
	this.sendCurrentStateToPlayer(p);
	this.players[id] = p;
};

PlayerSystem.prototype.sendCurrentStateToPlayer = function(p){
	var entities = this.core.es.getActiveEntities();
	for(var i in entities){
		var entity = entities[i];
		var data = entity.getInitialNetworkAttributes();
		var entityProduceEvent = new Event(consts.EVENT_ACTION.PRODUCE, {}, data);
		p.outgoingMessages.push(entityProduceEvent);
	}
};

PlayerSystem.prototype.sendWelcomeMessageToPlayer = function (p) {
	var data = [this.core.tick, this.core.tickRate, this.core.playersUpdateInterval, p.id];
	data.push(this.players.length);
	for (var i = 0; i < this.players.length; i++) {
		data.push(this.players[i].id);
	};
	var we = new Event(consts.EVENT_ACTION.WELCOME,{},data);
	p.outgoingMessages.push(we);
};

PlayerSystem.prototype.setEventBroadcast = function(cb) {
	this.eventBroadcast = cb;
	//
	this.addAI();
};

PlayerSystem.prototype.getSubscribedEvents = function(id) {
	return this.subscribedEvents[id];
};

module.exports = PlayerSystem;
