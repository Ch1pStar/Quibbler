

/**
 * [BaseSteering description]
 * @param {[type]} movement Owner
 */
function BaseSteering(movement) {
  this.movement = movement;
  
  this.enabled = true;
}

BaseSteering.prototype.calculateSteering = function(resultVector) {
  return this.enabled?this.calculateRealSteering(resultVector):[];  
};

BaseSteering.prototype.calculateRealSteering = function(resultVector) {

  //this should be implemented in extending classes
};

module.exports = BaseSteering;