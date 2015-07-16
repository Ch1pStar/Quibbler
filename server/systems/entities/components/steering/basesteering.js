

/**
 * [BaseSteering description]
 * @param {[type]} movement Owner
 */
function BaseSteering(movement) {
  this.movement = movement;
  
  this.enabled = true;

  this.limiter = null;
}

BaseSteering.prototype.calculateSteering = function(resultVector) {
  return this.enabled?this.calculateRealSteering(resultVector):[];  
};

BaseSteering.prototype.calculateRealSteering = function(resultVector) {

  //this should be implemented in extending classes
};


BaseSteering.prototype.getLimiter = function() {
  return this.limiter;
};

BaseSteering.prototype.getActualLimiter = function() {
  return this.limiter == null?this.movement:this.limiter;
};

module.exports = BaseSteering;