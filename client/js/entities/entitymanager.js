/**
 * EntityManager - Entity system manager, extends IManager
 */
define(['../core/imanager', 'entities/entity'], function(IManager, Entity){

  var EntityManager = IManager.extend({

    init: function(pGame, config){
      this._super();
      this.pGame = pGame;
      this.entities = [];
      this.maxEntityFrames = config.entityFrameHistoryLimit;
      this.entityLerpMsec = config.serverTickRate*config.serverUpdateInterval;
    },


    createEntity: function(data){
      this.entities.push(new Entity(this.pGame, data[0], data[1], data[2], data[3], 10));
    },

    process: function(){

      while(!this.eventQueue.empty()){
        var e = this.eventQueue.next();
        var lerpPlusLatency = this.entityLerpMsec; //+ this.serverLatency;
        // var lerpTargetTime = this.pGame.time._started + (e.data[2]*(1000/60));
        // console.log(lerpTargetTime, this.pGame.time.now);
        var lerpTargetTime = e.timeStamp;
        var currEntity = this.entities[e.data[3]];
        
        currEntity.frames.push({
          x:e.data[0],// + (Math.random()*300),
          y:e.data[1],// + (Math.random()*300),
          r:e.data[2],
          t:lerpTargetTime + lerpPlusLatency
        });
        $('#t-value').text(this.entities[0].frames.length);

        if(currEntity.frames.length >= this.maxEntityFrames) {
            currEntity.frames.splice(0,1);
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