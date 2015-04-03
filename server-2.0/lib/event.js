
 /**
 * @constructor
 * @param {int}
 * @param {Object}
 * @param {int}
 */
function Event(action, creator, data){

  if(typeof data == 'undefined'){
    data = null;
  }

  this.action = action;
  this.data = data;
	this.creator = creator;
	this.canPropagate = true;
}

/**
 * Returns the event message content
 * @return {Object}
 */
Event.prototype.read = function() {
  return {
    action: this.action,
    data: this.data,
    timeStamp: this.timeStamp
  };
};

Event.prototype.prepareForTransfer = function(bytesPerValue) {
  if(typeof bytesPerValue == 'undefined'){
    bytesPerValue = 8;
  }
  var bufLength = this.data?(this.data.length*bytesPerValue)+2:1;
	var buf = new Buffer(bufLength);
	buf.writeInt8(this.action,0);
	if(this.data){
		buf.writeInt8(bytesPerValue, 1);
	  for (var i = 0,j=2; i < this.data.length; i++,j+=bytesPerValue) {
	    if(bytesPerValue == 8){
	      buf.writeDoubleBE(this.data[i], j);
	    }else if(bytesPerValue == 4){
	      buf.writeFloatBE(this.data[i], j);
	    }else if (bytesPerValue == 2){
	      buf.writeInt16BE(this.data[i], j);
	    }else if (bytesPerValue == 1){
	      buf.writeInt8(this.data[i], j);
	    }
		};
	}
	return buf;
};

module.exports = Event;
