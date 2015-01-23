/**
 * IManager - Game Systems inteface
 */
define(['../eventqueue'], function(EventQueue){

  var IManager = Class.extend({
    init: function(){
        this.eventQueue = new EventQueue(2000);
    },

    process: function(){

    },

    processRender: function(){

    }

  });

  return IManager;
});