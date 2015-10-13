var Body = require('p2').Body;
var Rectangle = require('p2').Rectangle;
var Circle = require('p2').Circle;
var Material = require('p2').Material;
var Event = require('../../lib/event.js');
var EventDispatcher = require('../../lib/eventdispatcher.js');
var consts = require('../../lib/const.js');

//Components
var GroundMovement = require('./components/groundmovement');
var MeleeAttack = require('./abilities/meleeattack');
var RangeAttack = require('./abilities/rangeattack');
var TrainUnit = require('./abilities/trainunit');
var TestAbility = require('./abilities/testability');
var Health = require('./abilities/resources/health');

function Entity(config){

  var body = new Body({
    position: [config.x, config.y],
    mass: config.mass
    // angle: config.r
  });

  this.defaultMaterial = config.defaultMaterial;
  this.attackMaterial = config.attackMaterial;

  var shape = new Circle(config.width/2);
  shape.material = this.defaultMaterial;

  this.baseShape = shape;

  body.addShape(shape);

  this.body = body;


  this.id = config.id
  // this.id = this.body.id;

  this.manager = config.manager;

  this.owner = config.owner;
  this.visionRadius = config.visionRadius;
  this.seenBy = [];

  this.controlledBy = [this.owner.id];

  //attack is always first ability
  this.abilities = [];
  this.abilityQueue = [];
  
  this.type = config.type;  

  this.blocking = true;

  this.stateChanged = false;

  this.movement = new GroundMovement(this, config.movement);
  this.path = [];

  //Unit resources - health, mana etc
  this.resources = [new Health(this, 100)];


  this.abilityPool = {
    "train-unit": TrainUnit,
    "melee-attack": MeleeAttack,
    "range-attack": RangeAttack,
    "test-ability": TestAbility
  };

  this.eventDispatcher = this.manager.core.createEventDispatcher();
  this.eventDispatcher.registerEventBroadcaster(this);

  this.subscribedEvents = {};
}


//only in JavaScript 4Head
Entity.prototype.addAbility = function(name, args) {
  var ability = new this.abilityPool[name](this, args);
  this.abilities.push(ability);
  this.eventDispatcher.registerEventListener(ability);
};

Entity.prototype.getAbilities = function() {
  var res = [];
  for (var i = 0; i < this.abilities.length; i++) {
    res[i] = this.abilities[i].name;
  };
  return res;
};

Entity.prototype.addMoveCommand = function (data) {
  console.log("\t*** Adding move command to entity %d ***", this.id);
  this.movement.useQueue = data.useQueue;
  this.movement.moveOrders.push(data);
};

Entity.prototype.addAbilityCommand = function (data) {
  // this.abilityQueue[0] = data;
  this.abilityQueue.push(data);
};


Entity.prototype.update = function (time) {
  if(this.body.previousPosition[0] != this.body.position[0] || this.body.previousPosition[1] != this.body.position[1]){
    this.stateChanged = true;
    var posEvent = new Event(consts.EVENT_ENTITY_STATE_CHANGE.POSITION, this, {});
    this.eventBroadcast(posEvent);
  }

  if(this.body.previousAngle != this.body.angle){
    this.stateChanged = true;
    var posEvent = new Event(consts.EVENT_ENTITY_STATE_CHANGE.ORIENTATION, this, {});
    this.eventBroadcast(posEvent);
  }

  for (var i = 0; i < this.resources.length; i++) {
    var res = this.resources[i];
    if(res.value != res.previousValue){
      this.stateChanged = true;
      var resEvent = new Event(consts.EVENT_ENTITY_STATE_CHANGE.RESOURCE, this, res);
      this.eventBroadcast(resEvent);
    }
  };

  //movement
  this.movement.process(time);
  
  //abilities
  var abilityData;
  while(typeof(abilityData=this.abilityQueue.shift())!='undefined'){
    try{
      var ability = this.abilities[abilityData.index];
      ability.run(abilityData);
    }catch(e){
      console.error(e);
      // console.log("Invalid ability used - %d", abilityData[2]);
    }
  }
  //vision
  this.resolveSeenBy();


  //events
  this.eventDispatcher.handleEventQueue();
};

Entity.prototype.resolveSeenBy = function() {
  this.seenBy = [];
  for(var p in this.manager.core.ps.players){
    //tmp
    if(!this.manager.core.ps.players[p].isAI){
      this.seenBy.push(this.manager.core.ps.players[p].id);
    }
  }
};

Entity.prototype.setDefaultMaterial = function() {
  this.baseShape.material = this.defaultMaterial;
};

Entity.prototype.setAttackMaterial = function() {
  this.baseShape.material = this.attackMaterial;
};

Entity.prototype.getNetworkAttributes = function () {
  var res = [
    this.body.position[0],
    this.body.position[1],
    this.body.angle,
    this.id,
    this.visionRadius,
    this.owner.id
  ];
  if(this.resources.length>0){
    res.push(this.resources.length);
  }
  for (var i = 0; i < this.resources.length; i++) {
    res.push(this.resources[i].value);
  };

  if(this.seenBy.length>0){
    res.push(this.seenBy.length);
  }
  for (var j = 0; j < this.seenBy.length; j++) {
    res.push(this.seenBy[j]);
  };

  var path = this.path;
  if(path.length>0){
    res.push(1);

    var lastPathIndex = path.length-1;
    for (var i = 0; i < path[lastPathIndex].length; i++) {
      res.push(path[lastPathIndex][i]);
    }
  }
  res.unshift(res.length);
  return res;
};

Entity.prototype.getInitialNetworkAttributes = function () {
  var res = [
    this.body.position[0],
    this.body.position[1],
    this.body.angle,
    this.id,
    this.visionRadius,
    this.owner.id
  ];
  res.unshift(res.length);
  return res;
};

Entity.prototype.onDestroy = function() {
  this.cleanAbilities();
};

Entity.prototype.cleanAbilities = function() {
  for (var i = 0; i < this.abilities.length; i++) {
    this.abilities[i].destroy();
  };
};


Entity.prototype.setEventBroadcast = function(cb) {
  this.eventBroadcast = cb;
};

Entity.prototype.getSubscribedEvents = function(id) {
  return this.subscribedEvents[id];
};

module.exports = Entity;
