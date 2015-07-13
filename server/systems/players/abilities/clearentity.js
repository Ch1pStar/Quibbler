function ClearEntity (player) {
  this.name = "clear-entity";
  this.player = player
}

ClearEntity.prototype.run = function() {
  console.log("Used ability - %s at %d", this.name, this.player.manager.core.tick);

  var entities = this.player.manager.core.es.getActiveEntities();
  console.log(entities);
  if(entities.length>0){
    this.player.manager.core.es.removeEntity(entities[0].id);
  }
};

module.exports = ClearEntity;