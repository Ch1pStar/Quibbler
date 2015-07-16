var BaseSteering = require('./basesteering.js');
var Vec2 = require('../../../../lib/vectormath.js');

function Seek (movement, target) {
  this.movement = movement;
  this.target = target;
  this.arrivalTolerance = 2;
  this.idle = true;
}

//Steering Behaviors implements the basic steering class
Seek.prototype = new BaseSteering();




Seek.prototype.calculateRealSteering = function(resultVector) {
  this.idle = false;
  resultVector[0] = this.getTarget();
  Vec2.subtract(resultVector[0], this.movement.getPosition(), resultVector[0]);
  if(Vec2.len(resultVector[0])<this.arrivalTolerance){
    this.idle = true;
    resultVector[0] = [0,0];
    return resultVector;
  }
  Vec2.normalize(resultVector[0], resultVector[0]);
  Vec2.scale(resultVector[0], this.getActualLimiter().maxAcceleration, resultVector[0]);

  //No angular acceleration
  resultVector[1] = 0;

  return resultVector;
};



//Get value and not reference to the target object
Seek.prototype.getTarget = function() {
  return this.target.slice();
};

Seek.prototype.setTarget = function(target) {
  this.target = target;
};



module.exports = Seek;