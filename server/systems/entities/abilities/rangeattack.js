var Event = require('../../../lib/event.js');
var consts = require('../../../lib/const.js');
var Vec2d = require('../../../lib/vectormath.js');

function RangeAttack (entity) {
  this.entity = entity;
  this.name = "basic-range-attack";
  this.unitTarget = -1;
  this.unitTargetEdId = -1;

  this.attackRange = 650;
  this.swingTime = 650; //ms
  this.backswingTime = 50; //ms
  this.attackSwingId = -1;
  this.attackDamage = .1;

  this.subscribedEvents = {};

  this.activeProjectiles = [];

  //listen for global events
  this.entity.manager.core.eventDispatcher.registerEventListener(this);
  this.subscribedEvents[this.entity.manager.core.eventDispatcher.id] = {};
  //entity destroyed event is global, since there is no entity to broadcast a local one(its destroyed duh)
  this.subscribedEvents[this.entity.manager.core.eventDispatcher.id][consts.EVENT_ENTITY_ACTION.REMOVE] = this.onTargetDestroyed;


  //listen for own entity events
  this.subscribedEvents[this.entity.eventDispatcher.id] = {};
  this.subscribedEvents[this.entity.eventDispatcher.id][consts.EVENT_ENTITY_STATE_CHANGE.TARGET_REACHED] = this.onTargetReached;
  this.subscribedEvents[this.entity.eventDispatcher.id][consts.EVENT_ENTITY_STATE_CHANGE.POSITION] = this.selfPositionChange; 
}

RangeAttack.prototype.selfPositionChange = function(e) {
  //cancel attack upon movement
  if(this.attackSwingId > -1){
    // console.log("Unit moved and attack swing was interupted!");
    this.entity.manager.core.removeTimer(this.attackSwingId);
    this.attackSwingId = -1;
  }

  this.attemptSwing();

};

RangeAttack.prototype.attemptSwing = function() {
  if(this.unitTarget > -1){
    var distance = [];
    var target = this.entity.manager.entities[this.unitTarget];
    if(target){
      Vec2d.subtract(this.entity.body.position, target.body.position, distance);
      var distanceLen = Vec2d.len(distance);
      if(distanceLen < this.attackRange && this.attackSwingId < 0){
        // console.log("Starting to swing at target");
        this.entity.movement.setTarget(this.entity.body.position);
        this.attackSwingId = this.entity.manager.core.registerTimer(this.swingTime, this.doSwing, {}, this, false);
      }
    }
  }
};

RangeAttack.prototype.doSwing = function() {
  var target = this.entity.manager.entities[this.unitTarget];
  if(target){
    // console.log(
    //   "****************Unit %d was hit by %d at %d(%d)*******************", 
    //   this.unitTarget, this.entity.id, this.entity.manager.core.tick, 
    //   this.entity.manager.core.tick*this.entity.manager.core.tickRate
    // );
    
    this.attackSwingId = -1;
    // target.resources[0].sub(this.attackDamage);
    this.createProjectile(target);
    this.backswingId = this.entity.manager.core.registerTimer(this.backswingTime, this.attemptSwing, {}, this, false);
  }
};

RangeAttack.prototype.createProjectile = function(target) {
  var proj = this.entity.manager.createEntity({
    bodyProperties:{
      mass: 1,
      type: 4, //kinematic body,
      collisionResponse: false,
      position: this.entity.body.position
    },
    p: this.entity.owner,
    movement:'seek',
    visionRadius: 0
  });
  proj.movement.maxSpeed = 500;
  proj.movement.maxAcceleration = 500;
  var self = this;
  proj.movement.setTarget(target.body.position);
  var targetEdId = target.eventDispatcher.id;
  proj.subscribedEvents[targetEdId] = {};
  proj.subscribedEvents[targetEdId][consts.EVENT_ENTITY_STATE_CHANGE.POSITION] = function(e){
    proj.movement.setTarget(target.body.position);
  }

  target.eventDispatcher.registerEventListener(proj);

  proj.subscribedEvents[proj.eventDispatcher.id] = {};
  proj.subscribedEvents[proj.eventDispatcher.id][consts.EVENT_ENTITY.IMPACT] = function(e){
    if(e.data.id == target.id){
      proj.manager.removeEntity(proj.id);
      target.resources[0].sub(self.attackDamage);
    }
  }
  proj.eventDispatcher.registerEventListener(proj);

  this.activeProjectiles.push(proj);
};

RangeAttack.prototype.run = function(data) {
  console.log("Used ability - %s", this.name);
  console.log(data);
  this.entity.setAttackMaterial();
  if(data.target){
    this.unitTarget = data.target;
    var target = this.entity.manager.entities[data.target];
    target.eventDispatcher.registerEventListener(this);
    this.unitTargetEdId = target.eventDispatcher.id;
    this.subscribedEvents[this.unitTargetEdId] = {};
    this.subscribedEvents[this.unitTargetEdId][consts.EVENT_ENTITY_STATE_CHANGE.POSITION] = this.onTargetPositionChange;  
  }
  this.entity.movement.setTarget(data.groundTarget);
};

RangeAttack.prototype.onTargetPositionChange = function(e){
  // console.log("target position changed, readjusting");
  // console.log(e.creator.body.position);
  var distance = [];
  var target = this.entity.manager.entities[this.unitTarget];
  if(target){
    Vec2d.subtract(this.entity.body.position, target.body.position, distance);
    var distanceLen = Vec2d.len(distance);
    if(distanceLen > this.attackRange){
      this.entity.movement.setTarget(e.creator.body.position);
    }
  }
};

RangeAttack.prototype.clearTarget = function() {
  this.subscribedEvents[this.unitTargetEdId] = {};
  this.attackSwingId = -1;
  this.unitTarget = -1;
  this.backswingId = -1;
  for (var i = 0; i < this.activeProjectiles.length; i++) {
    var proj = this.activeProjectiles[i];
    if(proj){
      proj.manager.removeEntity(proj.id);
    }
  };
  this.activeProjectiles = [];
};

RangeAttack.prototype.onTargetDestroyed = function(e) {
  if(e.data[1] == this.unitTarget){
    console.log("TARGET DIED, CLEANING RESOURCES");
    this.clearTarget();
  }
};

RangeAttack.prototype.onTargetReached = function(e) {
  console.log("%d target reached", this.entity.id);
  this.entity.setDefaultMaterial();
  if(this.unitTarget > -1){
    this.subscribedEvents[this.unitTargetEdId] = {};
    this.unitTarget = -1;
  }
};

RangeAttack.prototype.destroy = function() {
  if(this.attackSwingId > -1 ){
    this.entity.manager.core.removeTimer(this.attackSwingId);
  }
};

RangeAttack.prototype.getSubscribedEvents = function(id) {
  return this.subscribedEvents[id];
};

module.exports = RangeAttack;