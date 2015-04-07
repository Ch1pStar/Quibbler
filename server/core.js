var System = require('./system.js');
var PlayerSystem = require('./systems/players/players.js');
var StatSystem = require('./systems/stats/stats.js');
var EntitySystem = require('./systems/entities/entities.js');
var MessageQueue = require('./lib/messagequeue.js');
var Event = require('./lib/event.js');
var consts = require('./lib/const.js');

function Core(config){
	var self = this;

	this.eventQueue = new MessageQueue();

	this.tick = 0;
	this.tickRate = config.tickRate;
	//Player updates are send every x ticks
	//3 = 20ups with 1000/60 tick rate
	this.playersUpdateInterval = config.updateInterval;
	this.systems = [];
	this.sId = 0;

	var ps = new PlayerSystem({
		id:this.sId++,
		port:config.port,
		parent: this
	});
	ps.setEventBroadcast(function(e){
		self.eventQueue.push(e);
	});
	this.ps = ps;

	this.systems.push(ps);

	var mapconfig = {
		tileWidth: 32,
		tileHeight: 32,
		width: 22,
		height: 22
	};


	var es = new EntitySystem(this.sId++, this.tickRate/1000, mapconfig, this);
	es.setEventBroadcast(function(e){
		self.eventQueue.push(e);
	});
	//Core systems are coupled together
	this.es = es;

	this.systems.push(es);

	var ss = new StatSystem(this.sId++);
	ss.setEventBroadcast(function(e){
		self.eventQueue.push(e);
	});

	this.systems.push(ss);



	setInterval(function(){
		self.handleEventQueue();
		self.es.update();
		self.tick++;
	}, self.tickRate);

}

Core.prototype.handleEventQueue = function () {
	while(!this.eventQueue.empty()){
		this.dispatchEvent(this.eventQueue.next());
	}

	// if(this.tick%this.playersUpdateInterval==0){
	// 	this.eventQueue.push(new Event(consts.EVENT_OUTGOING.FLUSH_PLAYER_MESSAGES),{},[]);
	// }
};

Core.prototype.dispatchEvent = function (e) {
	//Add a tick stamp to the event
	e.tick = this.tick;
	// console.log("----Begin Event(action: %s) Dispatch at %d(%dms)----", e.action, e.tick, Math.round(e.tick*this.tickRate));
	for(var s in this.systems){
		var currSystem = this.systems[s];
		var subbedEvents = currSystem.getSubscribedEvents();
		var eventCallback = subbedEvents[e.action];
		if(typeof eventCallback !== 'undefined'){
			if(e.canPropagate){
				eventCallback.apply(currSystem, [e]);
			}
		}
	}
	// console.log("------------Event Delivered----------");
};

module.exports = Core;
