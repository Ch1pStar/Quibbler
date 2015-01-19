/**
 * IManager - Game Systems inteface
 */
define(['../eventqueue'], function(EventQueue){

  var IManager = Class.extend({
    init: function(){
        this.eventQueue = new EventQueue(100);
    },

    process: function(){

    }

  });

  return IManager;
});