var Event = require('../../../lib/event.js');
var consts = require('../../../lib/const.js');
var Vec2d = require('../../../lib/vectormath.js');

var TargetInteraction = require('./components/targetinteraction');

function MeleeAttack (entity) {
  this.entity = entity;
  this.name = "basic-melee-attack";

  this.attackDamage = 1;

  this.interaction = null;
}

MeleeAttack.prototype.run = function(data) {
  console.log("Used ability - %s at %d", this.name, this.entity.manager.core.tick);
  if(data.target != null){
    var options = {
      ability: this,
      range: 50,
      interactionTime: 100,
      backswingTime: 50,
      target: data.target,
      action: this.dealDamage
    };
    this.interaction = new TargetInteraction(options);
  }else{
    this.entity.movement.setTarget(data.groundTarget);
  }
};

MeleeAttack.prototype.dealDamage = function(target) {
  target.resources[0].sub(this.attackDamage);
};

MeleeAttack.prototype.destroy = function() {
  this.interaction = null;
};

MeleeAttack.prototype.abilityFinished = function() {
  if(this.interaction != null){
    this.interaction.interactionFinished();
    this.interaction = null;
  }
};

module.exports = MeleeAttack;