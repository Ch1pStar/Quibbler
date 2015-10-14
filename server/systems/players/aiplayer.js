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
        if(data[2]){
          try{
            console.log(self.manager.core.es.entities[data[1]][data[2]]);
          }catch(e){
            console.error("Invalid entity id: \"%s\"", data[1]);
          }
        }else{
          console.log("Usage: info <entity id> <property>");
          if(data[1]){
            console.log("Available properties:");
            for(var prop in self.manager.core.es.entities[data[1]]){
              if(typeof prop != 'function'){
               console.log("\t",prop);
              }
            }  
          }
        }
      }else if(data[0] == 'pinfo'){
        console.log(self.manager.players.length);
      }else if(data[0] == 'shutdown'){
        console.log("Shutting down server...");
        process.exit(0);
      }
    }
  });
};


AIPlayer.prototype.spawnOrder = function (data) {
    var e = new Event(consts.EVENT_ENTITY_ACTION.SPAWN, {}, {
      p: this,
      type: parseInt(data[2]),
      bodyProperties: {
        position: [parseInt((data[0]*32)+16), parseInt((data[1]*32)+16)]
      }
    });
    this.manager.eventBroadcast(e);
};

module.exports = AIPlayer;
