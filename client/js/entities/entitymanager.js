/**
 * EntityManager - Entity system manager, extends IManager
 */
define(['../core/imanager', 'entities/entity'], function(IManager, Entity){

  var EntityManager = IManager.extend({

    init: function(pGame){
      this._super();
      this.pGame = pGame;
      this.entities = [new Entity(this.pGame, 100, 100)];
    },

    process: function(){

      while(!this.eventQueue.empty()){
        var e = this.eventQueue.next();
        console.log(e);
      }

      // for (var i = 0; i < this.entities.length; i++) {
      //   this.entities[i].update();
      //   this.entities[i].draw();
      // };
    } 
  });

  return EntityManager;
});