/**
 * EntityManager - Entity system manager, extends IManager
 */
define(['../core/imanager', 'entities/entity'], function(IManager, Entity){

  var EntityManager = IManager.extend({

    init: function(pGame){
      this._super();
      this.pGame = pGame;
      this.entities = [];
      this.maxEntityFrames = 3;
      this.entityLerpMsec = 200;
    },


    createEntity: function(x, y, type){
      this.entities.push(new Entity(this.pGame, x, y, 10));
    },

    process: function(){

      while(!this.eventQueue.empty()){
        var e = this.eventQueue.next();
        for (var i = 0; i < this.entities.length; i++) {
          this.entities[i].frames.push({
            x:e.data[0],
            y:e.data[1],
            t:e.data[2] + this.entityLerpMsec
          });

          if(this.entities[i].frames.length >= this.maxEntityFrames) {
              this.entities[i].frames.splice(0,1);
          }
        }
      }

      for (var i = 0; i < this.entities.length; i++) {
        var currEntity = this.entities[i];
        currEntity.update();
      };
    },

    processRender: function(){
      for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw();
      };
    },

  });

  return EntityManager;
});