var Event = require('../../../lib/event.js');
var consts = require('../../../lib/const.js');

function MeleeAttack (entity) {
  this.entity = entity;
  this.name = "basic-melee-attack";
  this.unitTarget = -1;

  this.subscribedEvents = {};

  this.subscribedEvents[this.entity.eventDispatcher.id] = {};
  this.subscribedEvents[this.entity.eventDispatcher.id][consts.EVENT_ENTITY_STATE_CHANGE.TARGET_REACHED] = this.onTargetReached;


  // this.subscribedEvents[consts.EVENT_ENTITY_STATE_CHANGE.ORIENTATION] = this.entityOrientationChangeListener;
  // this.subscribedEvents[consts.EVENT_ENTITY_STATE_CHANGE.TARGET_REACHED] = this.onTargetReached;
}

MeleeAttack.prototype.run = function(data) {

  console.log("Used ability - %s", this.name);
  console.log(data);
  this.entity.setAttackMaterial();
  if(data.target){
    this.unitTarget = data.target;
    var target = this.entity.manager.entities[data.target];
    target.eventDispatcher.registerEventListener(this);
    this.subscribedEvents[target.eventDispatcher.id] = {};
    this.subscribedEvents[target.eventDispatcher.id][consts.EVENT_ENTITY_STATE_CHANGE.POSITION] = this.onTargetPositionChange;
    this.subscribedEvents[target.eventDispatcher.id][consts.EVENT_ENTITY_STATE_CHANGE.TARGET_REACHED] = function(e){
      this.subscribedEvents[target.eventDispatcher.id] = {};
    };  
  }
  this.entity.movement.setTarget(data.groundTarget);
};

MeleeAttack.prototype.onTargetPositionChange = function(e){
  // console.log("target position changed, readjusting");
  // console.log(e.creator.body.position);
  this.entity.movement.setTarget(e.creator.body.position);
};


MeleeAttack.prototype.onTargetReached = function(e) {
  console.log("%d target reached", this.entity.id);
  this.entity.setDefaultMaterial();
  if(this.unitTarget > -1){
    var target = this.entity.manager.entities[this.unitTarget];
    this.subscribedEvents[target.eventDispatcher.id] = {};
    // this.subscribedEvents[consts.EVENT_ENTITY_STATE_CHANGE.POSITION] = this.onTargetPositionChange;
    this.unitTarget = -1;
  }
};

MeleeAttack.prototype.destroy = function() {
  
};

MeleeAttack.prototype.getSubscribedEvents = function(id) {
  return this.subscribedEvents[id];
};

module.exports = MeleeAttack;