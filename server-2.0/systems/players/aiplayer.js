var Event = require('../../lib/event.js');
var consts = require('../../lib/const.js');
var InputHandler = require('./inputhandler.js');
var MessageQueue = require('../../lib/messagequeue.js');

function AIPlayer(id, manager){
  this.id = id;
	this.name = 'ai-player';
	this.isAI = true;
	this.manager = manager;

  this.listenStdin();
}

AIPlayer.prototype.listenStdin = function () {

  var self = this;
  process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      var data = chunk.toString().trim().split(/\s+/gmi);
      var e;
      if(data[0] == 'move'){
        e = new Event(consts.EVENT_PLAYER_COMMAND.UNIT_MOVE_ORDER, {}, {
          p: self,
          eId: parseInt(data[1]),
          x: parseInt(data[2]),
          y: parseInt(data[3])
        });
        self.manager.eventBroadcast(e);
      }else if(data[0] == 'spawn'){
        e = new Event(consts.EVENT_PLAYER_COMMAND.UNIT_SPAWN, {}, {
          p: self,
          type: parseInt(data[1]),
          x: parseInt(data[2]),
          y: parseInt(data[3])
        });
        self.manager.eventBroadcast(e);
      }else if(data[0] == 'info'){
        console.log(self.manager.parent.es.entities[data[1]]);
      }
    }
  });
};


module.exports = AIPlayer;
