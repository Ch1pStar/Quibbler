var BaseSteering = require('./basesteering.js');
var Vec2 = require('../../../../lib/vectormath.js');

function Arrive(movement, target) {
  this.movement = movement;
  this.target = target;
  this.arrivalTolerance = 5;

  //TODO fix deceleration radius problem(stalls when it reaches the deceleration radius)
  this.decelerationRadius = 0;
  this.timeToTarget = 0.1;


  // this.toTarget = new Float32Array([0,0]);
  this.targetVelocity = new Float32Array([0,0]);

}


//Steering Behaviors implements the basic steering class
Arrive.prototype = new BaseSteering();

Arrive.prototype.calculateRealSteering = function(resultVector) {
  return this.arrive(resultVector, this.getTarget());
};

Arrive.prototype.arrive = function(resultVector, targetPosition) {

  // console.log(targetPosition);
  resultVector[0] = targetPosition;
  Vec2.subtract(resultVector[0], this.movement.getPosition(), resultVector[0]);
  var toTarget = resultVector[0];

  
  var distance = Vec2.len(toTarget);

  // Check if we are there, return no steering
  if(distance <= this.arrivalTolerance){
    return [[0,0],0];
  }

  var limiter = this.getActualLimiter();

  var targetSpeed = limiter.maxSpeed;

  // If we are inside the slow down radius calculate a scaled speed
  if (distance <= this.decelerationRadius){
    targetSpeed *= distance / this.decelerationRadius;
  }

  // Target velocity combines speed and direction
  Vec2.scale(toTarget, (targetSpeed/distance), this.targetVelocity);


  // Acceleration tries to get to the target velocity without exceeding max acceleration
  Vec2.subtract(this.targetVelocity, this.movement.getVelocity(), this.targetVelocity);
  Vec2.scale(this.targetVelocity, (1.0/this.timeToTarget), this.targetVelocity);
  Vec2.limit(this.targetVelocity, limiter.maxAcceleration, this.targetVelocity);

  resultVector[0] = this.targetVelocity
  // console.log(resultVector[0], this.targetVelocity);

  // No angular acceleration
  resultVector[1] = .0;

  // Output the steering
  return resultVector;

};


//Get value and not reference to the target object
Arrive.prototype.getTarget = function() {
  return this.target.slice();
};

Arrive.prototype.setTarget = function(target) {
  this.target = target;
};

module.exports = Arrive;