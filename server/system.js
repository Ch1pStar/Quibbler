var Event = require('./lib/event.js');
function System(id) {
	this.id = id;
	this.eventSendRate = 100;
	this.subscribedEvents = {
		a: function(e){
			console.log("Callback on system '%d' for a 'a' event with creator - %d", this.id, e.creator);
		},
		b: function(e){
			// e.canPropagate = false;
			console.log("Callback on system '%d' for a '2' event with creator - %d", this.id, e.creator);
		}
	};
}

System.prototype.startDispatchingEvents = function() {
	var self = this;
	setInterval(function(){
		var e = new Event('b', self.id);
		self.eventBroadcast(e);
		var e = new Event('a', self.id);
		self.eventBroadcast(e);
	},this.eventSendRate);
};

System.prototype.setEventBroadcast = function(cb) {
	this.eventBroadcast = cb;
};

System.prototype.getSubscribedEvents = function() {
	return this.subscribedEvents;
};

module.exports = System;
