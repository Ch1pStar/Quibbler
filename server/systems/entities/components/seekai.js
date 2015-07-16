var Seek = require('./steering/seek.js');
var MovementAI = require('./movementai.js');

function SeekAI (movement) {

  this.movement = movement;
  this.target = [this.movement.entity.body.position[0],this.movement.entity.body.position[1]];
  this.steering = new Seek(movement, this.target);

  this.steeringOutput = [[0,0],0];

}


SeekAI.prototype = new MovementAI();

SeekAI.prototype.setTarget = function(target) {
  this.target = target;
  this.steering.target= target;
};


SeekAI.prototype.move = function(time) {
  
  this.applySteering(this.steering.calculateSteering(this.steeringOutput), time);
};

module.exports = SeekAI;