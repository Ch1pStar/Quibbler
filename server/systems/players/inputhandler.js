var consts = require('../../lib/const.js');

function InputHandler(){

}

InputHandler.prototype.parseInputBuffer = function (buffer) {
  var len = buffer[0];
  for (var i = 0, j=1; i < len; i++, j++) {
    if(buffer[j] == consts.EVENT_INPUT.MOUSE_CLICK){
      var data = [buffer[j++], buffer[j++]];
    }else if(buffer[j] == consts.EVENT_INPUT.KEYBOARD_KEYPRESS){
      var data = [buffer[j++]];
    }
  };
  // console.log(buffer);
  console.log(data);
};


module.exports = InputHandler;
