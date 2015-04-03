var Event = require('../../lib/event.js');
var Entity = require('./entity.js');
var consts = require('../../lib/const.js');
var p2 = require('p2');

function EntitySystem(id, timestep, core) {
	this.id = id;
	this.timestep = timestep;
	this.name = 'entity-system';
	this.entities = [];
	this.eId = 0;
	this.core = core;
	var self = this;
	this.subscribedEvents = {};

	this.physics = this.createP2PhysicsWorld(true);


	this.subscribedEvents[consts.EVENT_PLAYER_COMMAND.UNIT_MOVE_ORDER] = function(e){
		// e.canPropagate = false;
		console.log("Player %d ordered unit %d to move to %d,%d", e.data.p.id, e.data.eId, e.data.x, e.data.y);
		var entity = this.entities[e.data.eId];
		this.moveEntity(entity, e.data);
	}

	this.subscribedEvents[consts.EVENT_PLAYER_COMMAND.UNIT_SPAWN] = function(e){
		e.canPropagate = false;
		console.log("Player %d issued a spawn entity order with type %d at %d,%d", e.data.p.id, e.data.type, e.data.x, e.data.y);
		this.createEntity(e.data);
	}

}

EntitySystem.prototype.update = function () {
	for(var i in this.entities){
		var currEntity = this.entities[i];
		currEntity.update();
	}

	this.physics.step(this.timestep);
};

EntitySystem.prototype.createP2PhysicsWorld = function (profiling) {
	var world = new p2.World({
		doProfiling: profiling,
		gravity: [0, 0],
	  broadphase: new p2.SAPBroadphase() // Broadphase algorithm
	});

  // world.solveConstraints = false;
  // world.applyGravity = false;
	return world;
};

EntitySystem.prototype.createEntity = function (data) {
	var id = this.eId++;
	var x = data.x;
	var y = data.y;
	var type = data.type;
	var entity = new Entity({
		id:id,
		x:x,
		y:y,
		r:0,
		width: 32,
		height: 32,
		visionRadius: 3,
		type:type,
		owner: data.p,
		manager: this
	});
	this.entities[id] = entity;
	this.physics.addBody(entity.body);


	var data = entity.getNetworkAttributes();
	var resultEvent = new Event(consts.EVENT_ACTION.PRODUCE, {}, data);
	this.eventBroadcast(resultEvent);
};

EntitySystem.prototype.moveEntity = function (entity, data) {
	// entity.path.push([data.x,data.y]);
	entity.path[0] = [data.x,data.y];
};

EntitySystem.prototype.setEventBroadcast = function(cb) {
	this.eventBroadcast = cb;
};

EntitySystem.prototype.getSubscribedEvents = function() {
	return this.subscribedEvents;
};

module.exports = EntitySystem;
