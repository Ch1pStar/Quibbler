var System = require('./system.js');
var PlayerSystem = require('./systems/players/players.js');
var StatSystem = require('./systems/stats/stats.js');
var EntitySystem = require('./systems/entities/entities.js');
var MessageQueue = require('./lib/messagequeue.js');
var EventDispatcher = require('./lib/eventdispatcher.js');
var Event = require('./lib/event.js');
var consts = require('./lib/const.js');

function Core(config){
	var self = this;
	this.edId = 0;

	this.eventDispatcher = this.createEventDispatcher();

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
	this.ps = ps;

	this.systems.push(ps);
	this.eventDispatcher.registerEventListener(ps);

	console.log("Map url - ", config.mapUrl);

	var es = new EntitySystem(this.sId++, this.tickRate/1000, config.mapUrl, this);

	//Core systems are coupled together, for now?
	this.es = es;
	this.eventDispatcher.registerEventListener(es);

	this.systems.push(es);

	var ss = new StatSystem({id:this.sId++, eventDispatcherId: this.eventDispatcher.id});

	this.systems.push(ss);
	this.eventDispatcher.registerEventListener(ss);


	this.timers = [];

	this.timersCounter = 0;

	setInterval(function(){
		self.eventDispatcher.handleEventQueue();
		self.es.update();
		self.ps.update();
		self.processTimers()
		self.tick++;
	}, self.tickRate);
}

Core.prototype.processTimers = function() {
	for (var i = 0; i < this.timers.length; i++) {
		var t  = this.timers[i];
		if((t.t+t.on) == this.tick){
			t.cb.call(t.cbCtx, t.d, this.es.physics.lastTimeStep);
			if(t.r){
				t.on=this.tick;
			}else{
				this.timers.splice(i--,1);
			}
		}
	};
};

//TODO assign and return id for cancel
Core.prototype.registerTimer = function(delay, callback, cbArg, ctx, interval) {
	if(typeof interval == 'undefined'){
		interval = false;
	}

	var delayTick;
	if(delay == 0){
		delayTick = 1;
	}else{
		delayTick = Math.round(delay/this.tickRate);
	}
	var timer = {t:delayTick, 
		on:this.tick,
		cb:callback,
		d:cbArg,
		cbCtx:ctx, 
		r:interval,
		id: this.timersCounter++
	};
	this.timers.push(timer);

	return timer.id;
};

Core.prototype.removeTimer = function(id) {
	for (var i = 0; i < this.timers.length; i++) {
		var t = this.timers[i];
		if(t.id == id){
			this.timers.splice(i, 1);
		}
	};
};


Core.prototype.createEventDispatcher = function() {
	return new EventDispatcher(this.edId++);
};

module.exports = Core;
