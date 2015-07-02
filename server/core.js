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
		outgoingPlayerMessageLimit: config.outgoingPlayerMessageLimit,
		parent: this
	});
	ps.setEventBroadcast(function(e){
		self.eventQueue.push(e);
	});
	this.ps = ps;

	this.systems.push(ps);

	console.log("asd - ", config.mapUrl);

	var es = new EntitySystem(this.sId++, this.tickRate/1000, config.mapUrl, this);
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


	this.timers = [];

	setInterval(function(){
		self.handleEventQueue();
		self.es.update();
		self.processTimers()
		self.tick++;
	}, self.tickRate);

}

Core.prototype.processTimers = function() {
	for (var i = 0; i < this.timers.length; i++) {
		var t  = this.timers[i];
		if((t.t+t.on) == this.tick){
			t.cb.call(t.cbCtx, t.d);
			if(t.r){
				t.on=this.tick;
			}else{
				this.timers.splice(i--,1);
			}
		}
	};
};

Core.prototype.registerTimer = function(delay, callback, cbArg, ctx, interval) {
	if(typeof interval == 'undefined'){
		interval = false;
	}
	console.log(interval);
	var delayTick = Math.round(delay/this.tickRate);
	this.timers.push({t:delayTick, 
		on:this.tick,
		cb:callback,
		d:cbArg,
		cbCtx:ctx, 
		r:interval
	});
};

Core.prototype.handleEventQueue = function () {
	while(!this.eventQueue.empty()){
		var e = this.eventQueue.next();
		this.dispatchEvent(e);
	}
};

Core.prototype.dispatchEvent = function (e) {
	//Add a tick stamp to the event
	e.tick = this.tick;
	console.log("----Begin Event(action: %s) Dispatch at %d(%dms)----", e.action, e.tick, Math.round(e.tick*this.tickRate));
	for(var s in this.systems){
		var currSystem = this.systems[s];
		var subbedEvents = currSystem.getSubscribedEvents();
		var eventCallback = subbedEvents[e.action];
		if(typeof eventCallback !== 'undefined'){
			if(e.canPropagate){
				eventCallback.call(currSystem, e);
			}
		}
	}
	console.log("------------Event Delivered----------\n");
};

module.exports = Core;
