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
  this.coreEDId = this.core.eventDispatcher.id;
  this.subscribedEvents = {};
  this.subscribedEvents[this.coreEDId] = {};

  this.entityDefaultMaterial = new p2.Material();
  this.entityAttackMaterial = new p2.Material();

  this.physics = this.createP2PhysicsWorld(true);
  
  this.addMap(mapUrl);

  this.pathfinder = new pf.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true
  });
  this.pfGrid = new pf.Grid(this.map.width, this.map.height);

  this.subscribedEvents[this.coreEDId][consts.EVENT_ENTITY_ACTION.MOVE] = function(e){
    // e.canPropagate = false;
    console.log("\tPlayer %d ordered unit %d to move to %d,%d", e.data.p.id, e.data.eId, e.data.x, e.data.y);
    var entity = this.entities[e.data.eId];
    
    if(entity.controlledBy.indexOf(e.data.p.id) > -1){
      entity.addMoveCommand({
        target:[e.data.x, e.data.y], 
        offset: [e.data.xOffset, e.data.yOffset], 
        useQueue: e.data.useQueue,
        onComplete: e.data.onComplete
      });
      // entity.addMoveCommand([e.data.x, e.data.y, e.data.xOffset, e.data.yOffset, e.data.useQueue]);
    }else{
      console.error("\tPlayer %d cannot control unit %d, (Owners: %s)", e.data.p.id, entity.id, entity.controlledBy);
    }
  }

  this.subscribedEvents[this.coreEDId][consts.EVENT_ENTITY_ACTION.SPAWN] = function(e){
    e.canPropagate = false;
    console.log("Player %d issued a spawn entity order with type %d at %d,%d", e.data.p.id, e.data.type, e.data.x, e.data.y);
    var data = e.data;
    data.mass = 1;
    this.createEntity(data);

    // this.addMapBounds();
  }

  this.subscribedEvents[this.coreEDId][consts.EVENT_PLAYER_COMMAND.UNIT_TARGET_ABILITY] = this.targetAbilityCommandListener;
  this.subscribedEvents[this.coreEDId][consts.EVENT_PLAYER_COMMAND.UNIT_GROUND_ABILITY] = this.groundAbilityCommandListener;


  this.addMapBounds();
}
  
EntitySystem.prototype.groundAbilityCommandListener = function(e) {

  var player = e.creator;
  player.highlightUnit = player.selection[0];
  var data = e.data;
  for (var i = 0; i < player.selection.length; i++) {
    var currEntity = player.selection[i];
    // var currEntity = player.highlightUnit;
    if(typeof currEntity != 'undefined'){
      var command = {
        target: null,
        groundTarget: [data[0], data[1]],
        index: data[2],
        useQueue: data[3]
      };
      currEntity.addAbilityCommand(command);  
    }
  };
};

  
EntitySystem.prototype.targetAbilityCommandListener = function(e) {

  var player = e.creator;
  player.highlightUnit = player.selection[0];
  var data = e.data;
  
  for (var i = 0; i < player.selection.length; i++) {
    var currEntity = player.selection[i];
    // var currEntity = player.highlightUnit;
    if(typeof currEntity != 'undefined'){
      var command = {
        target: data[0],
        groundTarget: this.entities[data[0]].body.position,
        index: data[1],
        useQueue: data[2]
      };
      currEntity.addAbilityCommand(command);  
    }
  };
};

EntitySystem.prototype.moveCommandListener = function(e) {


  var xTile = Math.round( (e.data[0]-(this.map.tileWidth/2)) /this.map.tileWidth);
  var yTile = Math.round( (e.data[1]-(this.map.tileHeight/2)) /this.map.tileHeight);

  var xTileX = xTile*this.map.tileWidth;
  var yTileY= yTile*this.map.tileHeight;

  var xTileOffset = e.data[0] - xTileX;
  var yTileOffset = e.data[1] - yTileY;

  if(!this.pfGrid.isWalkableAt(xTile,yTile)){
    //TODO return an error later on
    return;
  }

  var player = e.creator;
  
  for(var a  in player.selection){
    
    var currEntity = player.selection[a];
    var data = {
      p: player,
      x: xTileX,
      y: yTileY,
      xOffset: xTileOffset,
      yOffset: yTileOffset,
      useQueue:e.data[2],
      eId: currEntity.id
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
        (wallTile[0]*this.map.tileWidth)+this.map.tileHeight/2,
        (wallTile[1]*this.map.tileHeight)+this.map.tileHeight/2
      ], 
      mass: 0 
    });
    var tileShape = new p2.Rectangle(this.map.tileWidth, this.map.tileHeight);
    tileBody.addShape(tileShape);
    this.physics.addBody(tileBody);
    

    //Add wall tiles as units
    // this.createEntity({
    //  x: (wallTile[0]*32)+16,
    //  y: (wallTile[1]*32)+16,
    //  p: this.entities[0].owner,
    //  mass:0
    // });


    this.pfGrid.setWalkableAt(wallTile[0], wallTile[1], false);
    // console.log("Pos: %s %s", tileBody.position[0], tileBody.position[1]);
  };

  this.mapBounds = bounds;

};

EntitySystem.prototype.update = function () {
  for(var i in this.entities){
    var currEntity = this.entities[i];
    if(currEntity != null){
      var entityXBlocking = Math.round((currEntity.body.position[0]-(this.map.tileWidth/2))/this.map.tileWidth);
      var entityYBlocking = Math.round((currEntity.body.position[1]-(this.map.tileHeight/2))/this.map.tileHeight);
      // this.pfGrid.setWalkableAt(entityXBlocking, entityYBlocking,  !currEntity.blocking);
      currEntity.update(this.physics.lastTimeStep);
    }
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

  console.log(this, this.entityDefaultMaterial, this.entityAttackMaterial);
  var attackCM = new p2.ContactMaterial(this.entityDefaultMaterial, this.entityAttackMaterial,{
    friction : 1.0,
    restitution: 1
  });
  world.addContactMaterial(attackCM);


  // world.on('impact', function(e){
  //  console.log(e.bodyA.id);
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
    defaultMaterial: this.entityDefaultMaterial,
    attackMaterial: this.entityAttackMaterial,
    manager: this,
    id: this.eId++
  });
  entity.addAbility('melee-attack');
  entity.addAbility('test-ability', ['fp']);

  this.entities[entity.id] = entity;
  this.physics.addBody(entity.body);

  var data = entity.getInitialNetworkAttributes();
  var resultEvent = new Event(consts.EVENT_ACTION.PRODUCE, {}, data);
  this.eventBroadcast(resultEvent);
};

EntitySystem.prototype.removeEntity = function(eId) {
  var e = this.entities[eId];
  e.cleanAbilities();
  this.physics.removeBody(e.body);
  // this.entities.splice(this.entities.indexOf(e),1);
  var removeEvent = new Event(consts.EVENT_ENTITY_ACTION.REMOVE, {}, [1,eId]);
  this.core.ps.broadcastToPlayers(removeEvent);
  this.entities[eId] = null;
};

EntitySystem.prototype.removeAllEntities = function() {
  for (var i in this.entities) {
    var e = this.entities[i];
    if(e!=null){
      this.removeEntity(this.entities[i].id);
    }
  };
};

EntitySystem.prototype.getActiveEntities = function() {
  var data = [];
  for (var i = 0; i < this.entities.length; i++) {
    var e = this.entities[i];
    if(e!=null){
      data.push(e);
    }
  };
  return data;
};


EntitySystem.prototype.setEventBroadcast = function(cb) {
  this.eventBroadcast = cb;
};

EntitySystem.prototype.getSubscribedEvents = function(id) {
  return this.subscribedEvents[id];
};

module.exports = EntitySystem;
