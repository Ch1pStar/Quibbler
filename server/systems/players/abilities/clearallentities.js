function ClearAllEntities (player) {
  this.name = "clear-all-entities";
  this.player = player
}



ClearAllEntities.prototype.run = function(data) {
  console.log("Used ability - %s at %d", this.name, this.player.manager.core.tick);

  var entities = this.player.manager.core.es.entities;
  for (var i = 0; i < entities.length; i++) {
    var e  = entities[i];
    this.player.manager.core.es.physics.removeBody(e.body);
  };
  this.player.manager.core.es.entities = [];
};

module.exports = ClearAllEntities;