


function ClearAllEntities (player) {
  this.name = "clear-all-entities";
  this.player = player
}

ClearAllEntities.prototype.run = function() {
  console.log("Used ability - %s at %d", this.name, this.player.manager.core.tick);

  this.player.manager.core.es.removeAllEntities();
};

module.exports = ClearAllEntities;