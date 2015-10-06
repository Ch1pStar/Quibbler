function Health (ent, val) {
  this.name = "health";
  this.value = val;
  this.entity = ent;
}

/**
 * Reduce the resource(take damage in this case)
 * @param  {int} val 
 */
function reduce (val) {
  this.value -= val;
}


/**
 * Increase the resource(heal)
 * @param  {int} val 
 */
function increase (val) {
  this.value += val;
}


module.exports = Health;