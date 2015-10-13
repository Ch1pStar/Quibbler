var MessageQueue = require('./messagequeue.js');
var Event = require('./event.js');

function EventDispatcher (id) {
  this.id = id;
  this.eventQueue = new MessageQueue();
  this.eventListeners = [];
}


EventDispatcher.prototype.handleEventQueue = function () {
  while(!this.eventQueue.empty()){
    var e = this.eventQueue.next();
    this.dispatchEvent(e);
  }
};

EventDispatcher.prototype.registerEventListener = function(listener) {
  if(!typeof listener.getSubscribedEvents == 'function'){
    throw new("Event listeners should implement a getSubscribedEvents() function");
  }
  this.eventListeners.push(listener);
  //register listener as broadcaster aswell
  this.registerEventBroadcaster(listener);
};

EventDispatcher.prototype.registerEventBroadcaster = function(broadcaster) {
  if(typeof broadcaster.setEventBroadcast == 'function'){
    var self = this;
    broadcaster.setEventBroadcast(function(e){
      self.eventQueue.push(e);
    });
  }
};

EventDispatcher.prototype.removeEventListener = function(listener) {
  this.eventListeners.splice(this.eventListeners.indexOf(listener), 1);
};

EventDispatcher.prototype.dispatchEvent = function (e) {
  //Add a tick stamp to the event
  // e.tick = this.tick;
  // var ms = Math.round(e.tick*this.tickRate);
  // var x = ms/1000;
  // var seconds = Math.round(x%60);
  // x /= 60;
  // var minutes = Math.round(x%60);
  // x /= 60;
  // var hours = Math.round(x%24);
  // console.log("----Begin Event(action: %s) Dispatch at %d(%d:%d:%d)----", e.action, e.tick, hours, minutes, seconds);
  for(var s in this.eventListeners){
    var listener = this.eventListeners[s];
    var subbedEvents = listener.getSubscribedEvents(this.id);
    if(subbedEvents){
      var eventCallback = subbedEvents[e.action];
      if(eventCallback){
        if(e.canPropagate){
          eventCallback.call(listener, e);
        }
      }
    }
  }
  // console.log("------------Event Delivered----------\n");
};



module.exports = EventDispatcher;