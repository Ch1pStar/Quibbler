var Event = require('../../../lib/event');
var consts = require('../../../lib/const');

var TargetInteraction = require('./components/targetinteraction');

function TestAbility(entity, args) {
  this.name = "la-test-ability";
  this.subscribedEvents = {};
  this.entity = entity;

  this.attackDamage = 5;


  this.interaction = null;
}

TestAbility.prototype.run = function(data) {
  console.log("Used ability - %s at %d", this.name, this.entity.manager.core.tick);
  //data structure
  //{ target: null,
  // groundTarget: [ 910, 360 ],
  // index: 2,
  // useQueue: 0 }

  if(data.target != null){
    var options = {
      ability: this,
      range: 50,
      interactionTime: 150,
      backswingTime: 50,
      target: data.target,
      action: this.dealDamage
    };
    this.interaction = new TargetInteraction(options);
  }else{
    this.entity.movement.setTarget(data.groundTarget);
  }
};

TestAbility.prototype.dealDamage = function(target) {
  target.resources[0].sub(this.attackDamage);
};

TestAbility.prototype.destroy = function() {
  this.interaction = null;
};

TestAbility.prototype.abilityFinished = function() {
  if(this.interaction != null){
    this.interaction.interactionFinished();
    this.interaction = null;
  }
};

TestAbility.prototype.getSubscribedEvents = function() {
  return this.subscribedEvents;
};

module.exports = TestAbility;