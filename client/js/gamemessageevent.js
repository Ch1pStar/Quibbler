/**
 * A GameMessageEvent is the interface representing a command message
 * to execute on the game core process
 */
define([], function(){

 /**
 * @constructor
 * @param {int}
 * @param {Object}
 * @param {int}
 */
  function GameMessageEvent(action, data, timeStamp){
    if(typeof timeStamp == 'undefined'){
      timeStamp = (new Date()).getTime();
    }

    if(typeof data == 'undefined'){
      data = null;
    }

    this.action = action;
    this.data = data;
    this.timeStamp = timeStamp;
  }

  /**
   * Returns the event message contente
   * @return {Object}
   */
  GameMessageEvent.prototype.read = function() {
    return {
      action: this.action, 
      data: this.data,
      timeStamp: this.timeStamp
    };
  };


  GameMessageEvent.prototype.prepareForTransfer = function(transferMethod) {
    var data;
    if(transferMethod == 0){
      if(this.data){
        var h = new Float64Array(this.data);
        data = new Float64Array(this.data.length+1);
        data[0] = this.action;
        for (var i = 0; i < h.length; i++) {
          data[i+1] = h[i];
        };
      }else{
        data = new Float64Array([this.action]);
      }

    }else if(transferMethod == 1){

    }else{

    }
    return data.buffer;
  };

  return GameMessageEvent;
});