// var Event = require('../../lib/event.js');
var consts = require('../../lib/const.js');

function StatSystem(config) {
	this.id = config.id;
	this.name = 'stat-system';
  this.coreEDId = config.eventDispatcherId;
  this.subscribedEvents = {};
  this.subscribedEvents[this.coreEDId] = {};

	this.subscribedEvents[this.coreEDId][consts.EVENT_ACTION.PLAYER_CONNECTED] = this.defaultEventHandler;

	this.subscribedEvents[this.coreEDId][consts.EVENT_ACTION.PLAYER_DISCONNECTED] = this.defaultEventHandler;

	this.subscribedEvents[this.coreEDId][consts.EVENT_ACTION.PRODUCE] = this.defaultEventHandler;

	this.subscribedEvents[this.coreEDId][consts.EVENT_ACTION.AI_PLAYER_ADDED] = this.defaultEventHandler;

	// this.subscribedEvents[consts.EVENT_PLAYER_COMMAND.UNIT_MOVE] = this.defaultEventHandler;
	// this.subscribedEvents[consts.EVENT_PLAYER_COMMAND.UNIT_ATTACK] = this.defaultEventHandler;
	// this.subscribedEvents[consts.EVENT_PLAYER_COMMAND.UNIT_ABILITY] = this.defaultEventHandler;


	var self = this;
}

StatSystem.prototype.defaultEventHandler = function (e) {
	console.log("Stat system recording event(default handler): ", e);
};

StatSystem.prototype.setEventBroadcast = function(cb) {
	this.eventBroadcast = cb;
};

StatSystem.prototype.getSubscribedEvents = function(id) {
	return this.subscribedEvents[id];
};

module.exports = StatSystem;
