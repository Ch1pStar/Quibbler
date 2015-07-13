
 /**
 * @constructor
 * @param {int}
 * @param {Object}
 * @param {int}
 */
function Event(action, creator, data, networkReady){

  if(typeof data == 'undefined'){
    data = null;
  }

  if(typeof networkReady == 'undefined'){
    networkReady = true;
  }

  this.action = action;
  this.data = data;
	this.creator = creator;
	this.canPropagate = true;
  this.networkReady = networkReady;
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
  
  var nData;
  if(this.networkReady){
    nData = this.data;
  }else{
    nData = this.parseDataForNetwork();
  }

  if(typeof bytesPerValue == 'undefined'){
    bytesPerValue = 8;
  }
  var bufLength = nData?(nData.length*bytesPerValue)+2:1;
	var buf = new Buffer(bufLength);
	buf.writeInt8(this.action,0);
	if(nData){
		buf.writeInt8(bytesPerValue, 1);
	  for (var i = 0,j=2; i < nData.length; i++,j+=bytesPerValue) {
	    if(bytesPerValue == 8){
	      buf.writeDoubleBE(nData[i], j);
	    }else if(bytesPerValue == 4){
	      buf.writeFloatBE(nData[i], j);
	    }else if (bytesPerValue == 2){
	      buf.writeInt16BE(nData[i], j);
	    }else if (bytesPerValue == 1){
	      buf.writeInt8(nData[i], j);
	    }
		};
	}
	return buf;
};

Event.prototype.parseDataForNetwork = function() {
  var parsedData = [];
  for(var i in this.data){
    parsedData.push(this.data[i]);
  }
  parsedData.unshift(parsedData.length);
  return parsedData;
};

module.exports = Event;
