var BaseSteering = require('./basesteering.js');
var Vec2 = require('../../../../lib/vectormath.js');

function BlendedSteering (movement) {
  this.movement = movement;
}

//Steering Behaviors implements the basic steering class
BlendedSteering.prototype = new BaseSteering();




module.exports = BlendedSteering;