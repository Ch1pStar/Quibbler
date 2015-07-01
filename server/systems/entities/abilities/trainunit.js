var Event = require('../../../lib/event');
var consts = require('../../../lib/const');

function TrainUnit(entity) {
  this.name = "train-unit";

  this.entity = entity;

}





TrainUnit.prototype.run = function(data) {
  console.log("Used ability - %s", this.name);
  var e = new Event(consts.EVENT_ENTITY_ACTION.SPAWN, {}, {
    p: this.entity.owner,
    type: parseInt(data[2]),
    x: data[0]+16,
    y: data[1]+16
  });
  this.entity.manager.eventBroadcast(e);
};


module.exports = TrainUnit;