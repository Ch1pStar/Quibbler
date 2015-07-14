var Event = require('../../lib/event.js');
var consts = require('../../lib/const.js');
// var InputHandler = require('./input/inputhandler.js');
var MessageQueue = require('../../lib/messagequeue.js');

function AIPlayer(id, manager){
  this.id = id;
	this.name = 'ai-player';
	this.isAI = true;
	this.manager = manager;

  this.listenStdin();
}


AIPlayer.prototype.update = function() {
  
};


//tmp
AIPlayer.prototype.listenStdin = function () {

  var self = this;
  process.stdin.on('readable', function() {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      var data = chunk.toString().trim().split(/\s+/gmi);
      var e;
      if(data[0] == 'move'){
        e = new Event(consts.EVENT_ENTITY_ACTION.MOVE, {}, {
          p: self,
          eId: parseInt(data[1]),
          x: parseInt((data[2]*32)+16),
          y: parseInt((data[3]*32)+16)
        });
        self.manager.eventBroadcast(e);
      }else if(data[0] == 'spawn'){
        var parsedData = data;
        parsedData.shift();
        self.spawnOrder(parsedData);
      }else if(data[0] == 'info'){
        console.log(self.manager.core.es.entities[data[1]].body);
      }else if(data[0] == 'pinfo'){
        console.log(self.manager.players.length);
      }
    }
  });
};


AIPlayer.prototype.spawnOrder = function (data) {
    var e = new Event(consts.EVENT_ENTITY_ACTION.SPAWN, {}, {
      p: this,
      type: parseInt(data[2]),
      x: parseInt((data[0]*32)+16),
      y: parseInt((data[1]*32)+16)
    });
    this.manager.eventBroadcast(e);
};

module.exports = AIPlayer;
