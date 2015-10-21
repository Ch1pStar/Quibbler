var consts = require('../../../../lib/const');
var Vec2d = require('../../../../lib/vectormath.js');

function TargetInteraction(options) {
  this.ability = options.ability;
  this.entity = options.ability.entity;
  this.targetId = -1;
  this.targetEdId = -1;
  this.target = null;
  this.action = options.action;
  this.swingId = -1;
  this.backswingId = -1;

  this.range = options.range;
  this.interactionTime = options.interactionTime; //ms
  this.backswingTime = options.backswingTime; //ms

  this.subscribedEvents = {};

  //listen for target events
  this.setTarget(options.target);

  //listen for own entity events
  this.subEntityEvents();

  //listen for global events
  this.subGlobalEvents();


  //redudant distance check
  if(this.distanceToTarget() <= this.range){
    this.attemptInteraction();
  }else{
    this.entity.movement.setTarget(this.target.body.position);
  }
}

TargetInteraction.prototype.onSelfPositionChange = function(e) {
  if(this.swingId > -1){
    this.entity.manager.core.removeTimer(this.swingId);
    this.swingId = -1;
  }
  this.attemptInteraction();
};

TargetInteraction.prototype.attemptInteraction = function() {
  if(this.distanceToTarget() <= this.range && this.swingId < 0){
    this.entity.movement.setTarget(this.entity.body.position);
    this.swingId = this.entity.manager.core.registerTimer(this.interactionTime, this.doInteraction, {}, this, false);
  }
};

TargetInteraction.prototype.doInteraction = function() {
    this.swingId = -1;
    //do actual interaction
    if(this.action){
      this.action.call(this.ability, this.target);
    }
    this.backswingId = this.entity.manager.core.registerTimer(this.backswingTime, this.attemptInteraction, {}, this, false);
};

TargetInteraction.prototype.onTargetPositionChange = function(e) {
  if(this.distanceToTarget() > this.range){
    this.entity.movement.setTarget(this.target.body.position);
  }
};

TargetInteraction.prototype.onTargetReached = function(e) {
  
};

TargetInteraction.prototype.onTargetDestroyed = function(e) {
  this.interactionFinished();
};

TargetInteraction.prototype.interactionFinished = function(){
  this.subscribedEvents[this.targetEdId] = {};
  this.subscribedEvents[this.entity.eventDispatcher.id] = {};
  this.subscribedEvents[this.entity.manager.core.eventDispatcher.id] = {};

  if(this.swingId > -1 ){
    this.entity.manager.core.removeTimer(this.swingId);
  }
  if(this.backswingId > -1 ){
    this.entity.manager.core.removeTimer(this.backswingId);
  }
  this.swingId = -1;
  this.backswingId = -1;
  this.targetId = -1;
  this.targetEdId = -1;
};

TargetInteraction.prototype.distanceToTarget = function() {
  var distance = [];
  Vec2d.subtract(this.entity.body.position, this.target.body.position, distance);
  return Vec2d.len(distance);
};

TargetInteraction.prototype.setTarget = function(id) {
  var target = this.entity.manager.entities[id];
  this.target = target;
  this.targetId = target.id;
  this.targetEdId = target.eventDispatcher.id;

  this.subTargetEvents();
};

TargetInteraction.prototype.subGlobalEvents = function() {
  this.entity.manager.core.eventDispatcher.registerEventListener(this);
  this.subscribedEvents[this.entity.manager.core.eventDispatcher.id] = {};
  //entity destroyed event is global, since there is no entity to broadcast a local one(its destroyed duh)
  this.subscribedEvents[this.entity.manager.core.eventDispatcher.id][consts.EVENT_ENTITY_ACTION.REMOVE] = this.onTargetDestroyed;
};

TargetInteraction.prototype.subEntityEvents = function() {
  this.entity.eventDispatcher.registerEventListener(this);
  this.subscribedEvents[this.entity.eventDispatcher.id] = {};
  this.subscribedEvents[this.entity.eventDispatcher.id][consts.EVENT_ENTITY_STATE_CHANGE.TARGET_REACHED] = this.onTargetReached;
  this.subscribedEvents[this.entity.eventDispatcher.id][consts.EVENT_ENTITY_STATE_CHANGE.POSITION] = this.onSelfPositionChange; 
};

TargetInteraction.prototype.subTargetEvents = function() {
  this.target.eventDispatcher.registerEventListener(this);
  this.subscribedEvents[this.targetEdId] = {};
  this.subscribedEvents[this.targetEdId][consts.EVENT_ENTITY_STATE_CHANGE.POSITION] = this.onTargetPositionChange;
};

TargetInteraction.prototype.getSubscribedEvents = function(id) {
  return this.subscribedEvents[id];
};
module.exports = TargetInteraction;