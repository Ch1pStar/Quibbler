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
    this._action = action;
    this._data = data;
    this._timeReceived = timeReceived;
  }

  /**
   * Returns the event message contente
   * @return {Object}
   */
  GameMessageEvent.prototype.read = function() {
    return {action: this._action, data: this._data};
  };

  return GameMessageEvent;
});