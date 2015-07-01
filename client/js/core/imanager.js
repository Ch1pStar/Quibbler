/**
 * IManager - Game Systems inteface
 */
define(['../eventqueue', 'gamemessageevent'], function(EventQueue, GameMessageEvent){

  var IManager = Class.extend({
    init: function(){
        this.eventQueue = new EventQueue(2000);
        this.subscribedEvents = [];
    },

    setEventCallback: function(cb){
      this.eventCallback = cb;
    },

    setEventCallbackContext: function(cxt){
      this.eventCallbackContext = cxt;
    },

    fireEvent: function(message, data){
      var e = new GameMessageEvent(message, data);
      this.eventCallback.call(this.eventCallbackContext, e);
    },

    process: function(){

    },

    processRender: function(){

    },

    getSubscribedEvents: function(){
      return this.subscribedEvents;
    }

  });

  return IManager;
});