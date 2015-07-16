var Vec2 = require('../../../lib/vectormath.js');

function MovementAI () {}


MovementAI.prototype.applySteering = function(steering, time) {
  
  var vel = this.movement.getVelocity();
  Vec2.scale(vel, time, vel);
  Vec2.add(vel, steering[0], vel);
  Vec2.limit(vel, this.maxSpeed, vel);
};


module.exports = MovementAI;