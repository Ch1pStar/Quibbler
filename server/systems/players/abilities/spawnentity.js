var Event = require('../../../lib/event');
var consts = require('../../../lib/const');

function SpawnEntity(player) {
  this.name = "spawn-entity";

  this.player = player;

  this.trainTimeMs = 500;

}

SpawnEntity.prototype.run = function(data) {
  console.log("Used ability - %s at %d", this.name, this.player.manager.core.tick);

  this.player.manager.core.registerTimer(this.trainTimeMs, this.trainFinished, data, this, false);

};

SpawnEntity.prototype.trainFinished = function(data) {
  
  var e = new Event(consts.EVENT_ENTITY_ACTION.SPAWN, {}, {
    p: this.player,
    type: parseInt(data[2]),
    bodyProperties: {
      position: [data[0]+16, data[1]+16]
    }
  });

  this.player.manager.eventBroadcast(e);

};

module.exports = SpawnEntity;