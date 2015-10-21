var Event = require('../../../lib/event.js');
var consts = require('../../../lib/const.js');
var Vec2d = require('../../../lib/vectormath.js');

var TargetInteraction = require('./components/targetinteraction');

function RangeAttack (entity) {
  this.entity = entity;
  this.name = "basic-range-attack";
  this.unitTarget = -1;
  this.unitTargetEdId = -1;


  this.attackDamage = .3;

  this.activeProjectiles = [];

}

RangeAttack.prototype.run = function(data) {
  console.log("Used ability - %s at %d", this.name, this.entity.manager.core.tick);
  if(data.target != null){
    var options = {
      ability: this,
      range: 500,
      interactionTime: 50,
      backswingTime: 0,
      target: data.target,
      targetDestroyed: this.clearTarget,
      action: this.createProjectile
    };
    this.interaction = new TargetInteraction(options);
  }else{
    this.entity.movement.setTarget(data.groundTarget);
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
  proj.isProjectile = true;
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
      this.dealDamage();
    }
  }
  proj.eventDispatcher.registerEventListener(proj);

  this.activeProjectiles.push(proj);
};

RangeAttack.prototype.dealDamage = function() {
  target.resources[0].sub(self.attackDamage);
};

RangeAttack.prototype.abilityFinished = function() {
  if(this.interaction != null){
    this.interaction.interactionFinished();
    this.interaction = null;
  }
};

RangeAttack.prototype.destroy = function() {
  this.interaction = null;
};

RangeAttack.prototype.clearTarget = function() {
  for (var i = 0; i < this.activeProjectiles.length; i++) {
    var proj = this.activeProjectiles[i];
    if(proj && proj.isProjectile){
      proj.manager.removeEntity(proj.id);
    }
  };
  this.activeProjectiles = [];
};

module.exports = RangeAttack;