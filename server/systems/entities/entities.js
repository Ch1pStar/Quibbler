var Event = require('../../lib/event.js');
var Entity = require('./entity.js');
var consts = require('../../lib/const.js');
var p2 = require('p2');
var pf = require('pathfinding');
var Map = require('../../lib/map.js');

function EntitySystem(id, timestep, mapUrl, core) {
	this.id = id;
	this.timestep = timestep;
	this.name = 'entity-system';
	this.entities = [];
	this.eId = 0;
	this.core = core;
	var self = this;
	this.subscribedEvents = {};

	this.physics = this.createP2PhysicsWorld(true);

	this.addMap(mapUrl);


	this.pathfinder = new pf.AStarFinder({
		allowDiagonal: true,
		dontCrossCorners: true
	});
	this.pfGrid = new pf.Grid(this.map.width, this.map.height);

	this.subscribedEvents[consts.EVENT_ENTITY_ACTION.MOVE] = function(e){
		// e.canPropagate = false;
		console.log("\tPlayer %d ordered unit %d to move to %d,%d", e.data.p.id, e.data.eId, e.data.x, e.data.y);
		var entity = this.entities[e.data.eId];
		entity.addMoveCommand([e.data.x,e.data.y]);
	}

	this.subscribedEvents[consts.EVENT_ENTITY_ACTION.SPAWN] = function(e){
		e.canPropagate = false;
		console.log("Player %d issued a spawn entity order with type %d at %d,%d", e.data.p.id, e.data.type, e.data.x, e.data.y);
		var data = e.data;
		data.mass = 1;
		this.createEntity(data);

		// this.addMapBounds();
	}

	this.subscribedEvents[consts.EVENT_PLAYER_COMMAND.UNIT_ABILITY] = this.abilityCommandListener;
	this.subscribedEvents[consts.EVENT_PLAYER_COMMAND.UNIT_MOVE] = this.moveCommandListener;


	this.addMapBounds();
}

	
EntitySystem.prototype.abilityCommandListener = function(e) {
	var player = e.creator;
	player.selection = [];
	player.selection.push(this.entities[0]);
	player.highlightUnit = player.selection[0];

	var currEntity = player.highlightUnit;
	currEntity.addAbilityCommand(e.data);	

};

EntitySystem.prototype.moveCommandListener = function(e) {
  var xTile = Math.round( (e.data[0]-32/2) /32);
  var yTile = Math.round( (e.data[1]-32/2) /32);

	if(!this.pfGrid.isWalkableAt(xTile,yTile)){
		//this should return an error later on
		return;
	}

	var player = e.creator;
	player.selection = [];
	// player.selection.push(this.entities[0]);
	for (var i = 0; i < this.entities.length; i++) {
		player.selection.push(this.entities[i]);
	};

	

  var testId = 0;
	for(var a  in player.selection){
		
		var currEntity = player.selection[a];
		var data = {
	    p: player,
	    x: xTile*32,
	    y: yTile*32,
	    eId: currEntity.id,
	    testId: testId++
	  };
		
		var moveEvent = new Event(consts.EVENT_ENTITY_ACTION.MOVE, this, data);
    this.eventBroadcast(moveEvent);
	}
};

EntitySystem.prototype.addMap = function(url) {
	var map = new Map(url);
	this.map = map;
};

EntitySystem.prototype.addMapBounds = function() {
	var bounds = this.map.getBoundsData();
	for (var i = 0; i < bounds.length; i++) {
		var wallTile = bounds[i];

		var tileBody =  new p2.Body({ 
			position: [
				(wallTile[0]*32)+16,
				(wallTile[1]*32)+16
			], 
			mass: 0 
		});
		var tileShape = new p2.Rectangle(this.map.tileWidth, this.map.tileHeight);
		tileBody.addShape(tileShape);
		this.physics.addBody(tileBody);
		

		//Add wall tiles as units
		// this.createEntity({
		// 	x: (wallTile[0]*32)+16,
		// 	y: (wallTile[1]*32)+16,
		// 	p: this.entities[0].owner,
		// 	mass:0
		// });


		this.pfGrid.setWalkableAt(wallTile[0], wallTile[1], false);
		// console.log("Pos: %s %s", tileBody.position[0], tileBody.position[1]);
	};

	this.mapBounds = bounds;

};

EntitySystem.prototype.update = function () {
	for(var i in this.entities){
		var currEntity = this.entities[i];

		var entityXBlocking = Math.round((currEntity.body.position[0]-16)/this.map.tileWidth);
		var entityYBlocking = Math.round((currEntity.body.position[1]-16)/this.map.tileHeight);
		// this.pfGrid.setWalkableAt(entityXBlocking, entityYBlocking,	!currEntity.blocking);

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

	world.sleepMode = p2.World.BODY_SLEEPING;
	// world.solveConstraints = false;
	world.applyGravity = false;

	// world.on('impact', function(e){
	// 	console.log(e.bodyA.id);
	// });
	return world;
};

EntitySystem.prototype.createEntity = function (data) {
	var x = data.x;
	var y = data.y;
	var type = data.type;
	var entity = new Entity({
		x:x,
		y:y,
		r:0,
		width: this.map.tileWidth,
		height: this.map.tileHeight,
		visionRadius: 2,
		type:type,
		owner: data.p,
		mass: data.mass,
		manager: this,
		id: this.eId++
	});
	entity.addAbility('melee-attack');
	entity.addAbility('train-unit');

	this.entities[entity.id] = entity;
	this.physics.addBody(entity.body);

	var data = entity.getInitialNetworkAttributes();
	var resultEvent = new Event(consts.EVENT_ACTION.PRODUCE, {}, data);
	this.eventBroadcast(resultEvent);
};


EntitySystem.prototype.setEventBroadcast = function(cb) {
	this.eventBroadcast = cb;
};

EntitySystem.prototype.getSubscribedEvents = function() {
	return this.subscribedEvents;
};

module.exports = EntitySystem;
