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


  GameMessageEvent.prototype.prepareForTransfer = function(transferMethod, bytesPerValue) {
    if(typeof bytesPerValue == 'undefined'){
      bytesPerValue = 8;
    }
    var data;
    if(transferMethod == 0){
      var bufLength = this.data?(this.data.length*bytesPerValue)+2:1;
      var buf = new ArrayBuffer(bufLength);
      var dw = new DataView(buf);
      dw.setInt8(0, this.action);
      if(this.data){
        dw.setInt8(1, bytesPerValue);
        for (var i = 0,j=2; i < this.data.length; i++,j+=bytesPerValue) {
          if(bytesPerValue == 8){
            dw.setFloat64(j, this.data[i]);
          }else if(bytesPerValue == 4){
            dw.setFloat32(j, this.data[i]);  
          }else if (bytesPerValue == 2){
            dw.setInt16(j, this.data[i]);
          }else if (bytesPerValue == 1){
            dw.setInt8(j, this.data[i]);
          }
        };
      }
      return dw.buffer;
    }else if(transferMethod == 1){

    }else{

    }
  };
  console.log(this);
  return GameMessageEvent;
});