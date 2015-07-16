var Vec2 = require('./../../../../../lib/vectormath.js');

/**
 * Members are positioned in a circle around the target(anchor)
 * @param {float} memberRadius The radius of one member. This is needed to determine how close we can pack a given number of members around circle. 
 */
function CircleFormationPattern (memberRadius) {
  this.memberRadius = memberRadius;

  this.numberOfSlots = 1;
  this.PI2 = Math.PI*2;
}

function calculateSlotLocation (resultPosition, slotIndex) {
  if(this.numberOfSlots){
    var angleAroundCircle = (this.PI2*slotIndex)/numberOfSlots;

    var radius = this.memberRadius/Math.sin(Math.PI/this.numberOfSlots);

    Vec2.angleToVector(angleAroundCircle, resultPosition[0]);
    Vec2.scale(resultPosition[0], radius, resultPosition[0]);
    resultPosition[1] = angleAroundCircle;

  }else{
    resultPosition = [[0,0], (this.PI2*slotIndex)];
  }

  return resultPosition;
}


CircleFormationPattern.prototype.supportsSlots = function(number) {
  //this pattern supports any number of slots
  return true;
};


module.exports = CircleFormationPattern;