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
  function GameMessageEvent(action, data, timeReceived){
    this.action = action;
    this.data = data;
    this.timeReceived = timeReceived;
  }

  /**
   * Returns the event message contente
   * @return {Object}
   */
  GameMessageEvent.prototype.read = function() {
    return {
      action: this.action, 
      data: this.data,
      timeReceived: this._timeReceived
    };
  };

  return GameMessageEvent;
});