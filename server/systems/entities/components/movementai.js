var Vec2 = require('../../../lib/vectormath.js');

function MovementAI () {}


MovementAI.prototype.applySteering = function(steering, time) {
  var vel = this.movement.getVelocity();
  var angularVel = this.movement.getAngularVelocity();
  Vec2.scale(vel, time, vel);
  Vec2.add(vel, steering[0], vel);
  this.movement.entity.body.angularVelocity = steering[1];
  Vec2.limit(vel, this.maxSpeed, vel);
};


module.exports = MovementAI;