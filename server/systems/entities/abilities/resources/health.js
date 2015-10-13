function Health (ent, val) {
  this.name = "health";
  this.value = val;
  this.previousValue = val;
  this.entity = ent;
}

/**
 * Reduce the resource(take damage in this case)
 * @param  {int} val 
 */
Health.prototype.sub = function(val) {
  this.changeVal(this.value-val);
}


/**
 * Increase the resource(heal)
 * @param  {int} val 
 */
Health.prototype.add = function(val) {
  this.changeVal(this.value+val);
}

Health.prototype.changeVal = function(val) {
  if(val < 0){
    val = 0;
  }
  this.previousValue = this.value;
  this.value = val;

  if(this.value <= 0){
    this.entity.manager.removeEntity(this.entity.id);
  }
};


module.exports = Health;