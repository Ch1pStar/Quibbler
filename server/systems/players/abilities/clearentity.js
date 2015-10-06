function ClearEntity (player) {
  this.name = "clear-entity";
  this.player = player
}

ClearEntity.prototype.run = function() {
  console.log("Used ability - %s at %d", this.name, this.player.manager.core.tick);

  if(this.player.selection.length>0){
    for (var i = 0; i < this.player.selection.length; i++) {
      var ent = this.player.selection[i];
      this.player.manager.core.es.removeEntity(ent.id);
    };
  }
};

module.exports = ClearEntity;