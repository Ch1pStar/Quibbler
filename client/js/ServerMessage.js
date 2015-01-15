define([], function(){

  function ServerMessage(action, data, timeReceived){
    this._action = action;
    this._data = data;
    this._timeReceived = timeReceived;
  }

  ServerMessage.prototype.read = function() {
    return {action: this._action, data: this._data};
  };

  return ServerMessage;
});