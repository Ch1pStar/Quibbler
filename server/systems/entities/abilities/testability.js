var Event = require('../../../lib/event');
var consts = require('../../../lib/const');

function TestAbility(entity, args) {
  this.name = "test-ability";

  this.subscribedEvents = {};

  this.entity = entity;
  
}

TestAbility.prototype.run = function(data) {
  console.log("Used ability - %s at %d", this.name, this.entity.manager.core.tick);
  console.log(data);
  this.entity.setAttackMaterial();
  this.entity.movement.setTarget(data.groundTarget, this, this.onTargetReached);
};

TestAbility.prototype.onTargetReached = function() {
  console.log("target reached");
  this.entity.setDefaultMaterial();
};

TestAbility.prototype.destroy = function() {
  
};


TestAbility.prototype.getSubscribedEvents = function() {
  return this.subscribedEvents;
};


module.exports = TestAbility;