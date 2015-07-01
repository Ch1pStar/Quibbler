var inputcfg = require('./inputconfig.js');
var consts = require('../../../lib/const.js');
var Event = require('../../../lib/event.js');

function CommandInputHandler (player) {
  this.player = player
}


/**
 * Takes a raw client input and returns an array of {Event}
 * objects with the parsed input data
 * @param  {Array} data raw client input data
 * @return {Array<Event>}      parsed events array
 */
CommandInputHandler.prototype.parseCommandBuffer = function(data) {  
  var len = data.shift();
  var eventsArray = [];
  for (var i = 0; i < len; i++) {
    var action = data.shift();
    var commandLen = inputcfg[action];
    var commandData = [];
    for(var a = 0; a < commandLen; a++){
      commandData.push(data.shift());
    }
    var e = new Event(action, this.player, commandData);
    eventsArray.push(e);
  };
  return eventsArray;
};



module.exports = CommandInputHandler;