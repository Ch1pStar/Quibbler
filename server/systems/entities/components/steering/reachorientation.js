var BaseSteering = require('./basesteering.js');
var Vec2 = require('../../../../lib/vectormath.js');

function ReachOrientation (movement) {
  this.movement = movement;
}

//Steering Behaviors implements the basic steering class
ReachOrientation.prototype = new BaseSteering();

ReachOrientation.prototype.calculateRealSteering = function(resultVector, targetOrientation) {
  
};


module.exports = ReachOrientation;