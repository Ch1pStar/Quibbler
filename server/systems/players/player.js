var Event = require('../../lib/event.js');
var consts = require('../../lib/const.js');
var CommandInputHandler = require('./input/commandinputhandler.js');
var MessageQueue = require('../../lib/messagequeue.js');

function Player (id, ws, manager) {
	this.id = id;
	this.name = 'player';
	this.isAI = false;
	this.connection = ws;
	this.manager = manager;
	this.inputHandler = new CommandInputHandler(this);
	this.outgoingMessages = new MessageQueue(this.manager.outgoingPlayerMessageLimit);
	var self = this;
	this.connected = true;
	this.connection.on('message', function(data){
		self.onMessage(data);
	});
	this.connection.on('close', function(){
		self.onDisconnect();
	});

  //Collection of the currently selected units that will respond to a move/attack/ability command
  this.selection = [];

  this.highlightUnit;


  
} 

Player.prototype.flushOutgoingMessages = function () {
	while(!this.outgoingMessages.empty()){
		var e = this.outgoingMessages.next();
		this.sendMessage(e);
	}
};

Player.prototype.onDisconnect = function () {
	this.connected = false;
	var e = new Event(consts.EVENT_ACTION.PLAYER_DISCONNECTED,{},{p:this});
	this.manager.eventBroadcast(e);
};

Player.prototype.onMessage = function(msg) {
	var data = this.parseMessage(msg);
  if(data.action == consts.EVENT_ACTION.PING){
		this.pingReply();
	}else{

    //Create an array of parsed commands(events) and broadcast them in order
		var parsedInput = this.inputHandler.parseCommandBuffer(data.data);

    for(var i in parsedInput){
      var e = parsedInput[i];
      this.manager.eventBroadcast(e);
    }

    // this.manager.eventBroadcast(data);
	}
};

Player.prototype.pingReply = function () {
	var date = new Date();
	var ts = date.getTime();
	var d = [ts];
	var data = new Event(consts.EVENT_ACTION.PING, {}, d);
	this.sendMessage(data);
};

Player.prototype.sendMessage = function (msg, bytesPerValue) {
	var data = msg.prepareForTransfer(bytesPerValue);
	if(data){
		return this.connection.send(data);
	}
};

Player.prototype.parseMessage = function (msg) {
	var msgObj;
  try{
    var data = null;

		if(msg.length > 1){
      var bytesPerValue = msg.readInt8(1);
      data = new Array((msg.length - 2)/bytesPerValue);
      for (var i = 0,j=2; i < data.length; i++,j+=bytesPerValue) {
        if(bytesPerValue == 8){
          data[i] = msg.readDoubleBE(j);
        }else if(bytesPerValue == 4){
          data[i] = msg.readFloatBE(j);
        }else if(bytesPerValue == 2){
          data[i] = msg.readInt16BE(j);
        }else if(bytesPerValue == 1){
          data[i] = msg.readInt8(j);
        }
      }
    }
    msgObj = new Event(msg.readInt8(0),{}, data);

    return msgObj;
  }catch(e){
    console.error("Error parsing client message");
		console.log(e);
    return false;
  }finally{
    // console.log(msgObj);
  }
};

module.exports = Player;
