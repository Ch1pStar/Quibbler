function MeleeAttack (entity) {
  this.entity = entity;
  this.name = "basic-melee-attack";
}

MeleeAttack.prototype.run = function(data) {
  console.log("Used ability - %s", this.name);
};



/**
 * 
 * @param  target {Entity}
 * @return {int}
 */
MeleeAttack.prototype.distance = function (target) {
  var srcXTile = Math.round(this.entity.body.position[0]);
  var srcYTile = Math.round(this.entity.body.position[1]);
  
  var tarXTile = Math.round(target.entity.body.position[0]);
  var tarYTile = Math.round(target.entity.body.position[1]);

  return Math.sqrt((srcXTile - tarXTile) * (srcXTile - tarXTile)  + (srcYTile - tarYTile) * (srcYTile - tarYTile));
};

module.exports = MeleeAttack;