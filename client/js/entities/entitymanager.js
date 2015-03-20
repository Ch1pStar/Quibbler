/**
 * EntityManager - Entity system manager, extends IManager
 */
define(['../core/imanager', 'entities/entity'], function(IManager, Entity){

  var EntityManager = IManager.extend({

    init: function(pGame, config){
      this._super();
      this.pGame = pGame;
      this.tileMap = config.map;
      this.entities = [];
      this.maxEntityFrames = config.entityFrameHistoryLimit;
      this.entityLerpMsec = config.serverTickRate*config.serverUpdateInterval;
    },

    setPlayingPlayer: function(player){
      this.playingPlayer = player;
    },

    addFogOfWar: function(){
      var mapWidth = this.tileMap.pMap.width;
      var mapHeight = this.tileMap.pMap.height;
      var tileWidth = this.tileMap.pMap.tileWidth;
      var tileHeight = this.tileMap.pMap.tileHeight;
      this.fogMask = new Array(mapWidth);
      this.fogMaskGroup = new Phaser.Group(this.pGame);
      for (var i = 0; i < mapWidth; i++) {
        this.fogMask[i] = new Array(mapHeight);
        for (var j = 0; j < mapHeight; j++) {
          var fogTile = this.pGame.add.graphics(i*tileWidth,j*tileHeight);
          fogTile.lineStyle(0, 0xAAAAAA, 1); // width, color (0x0000FF), alpha (0 -> 1) // required settings
          fogTile.beginFill(0xBBBBBB, .4) // color (0xFFFF0B), alpha (0 -> 1) // required settings
          fogTile.drawRect(0, 0, tileHeight, tileHeight); // x, y, width, height
          this.fogMaskGroup.addChild(fogTile);
          this.fogMask[i][j] = 0;
        };
      };
      
    },

    createEntity: function(data, owner){
      var config = {
        x: data[0],
        y: data[1],
        r: data[2],
        visionRadius: data[3],
        id: data[4],
        type: 10,
        owner: owner,
        manager: this
      };
      this.entities.push(new Entity(this.pGame, config));
    },

    process: function(){
      if(!this.eventQueue.empty()){
        this.resetFogMask();
      }

      while(!this.eventQueue.empty()){
        var e = this.eventQueue.next();
        var lerpPlusLatency = this.entityLerpMsec; //+ this.serverLatency;
        // var lerpTargetTime = this.pGame.time._started + (e.data[2]*(1000/60));
        // console.log(lerpTargetTime, this.pGame.time.now);
        var lerpTargetTime = e.timeStamp;
        var currEntity = this.entities[e.data[3]];
        var currEntitySeenByLength = e.data.length - 4;
        var currEntitySeenByArr = new Array(currEntitySeenByLength);
        for (var i = 0; i < currEntitySeenByLength; i++) {
          var currEntitySeenBy = e.data[i+4];
          currEntitySeenByArr[i] = currEntitySeenBy;
        };

        currEntity.frames.push({
          x:e.data[0],// + (Math.random()*300),
          y:e.data[1],// + (Math.random()*300),
          r:e.data[2],
          seenBy: currEntitySeenByArr,
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

      this.updateFogMask();
    },

    resetFogMask: function(){
      for (var i = 0; i < this.fogMask.length; i++) {
        for (var j = 0; j < this.fogMask[i].length; j++) {
          this.fogMask[i][j] = 0;
        };
      };
    },

    updateFogMask: function(){
      for (var i = 0; i < this.fogMask.length; i++) {
        for (var j = 0; j < this.fogMask[i].length; j++) {
          var index = Math.max(0,(i*this.fogMask[i].length-1)+j);
          if(this.fogMask[i][j]==1){
            this.fogMaskGroup.getChildAt(index).visible = false;
          }else if(this.fogMask[i][j] == 0){
            this.fogMaskGroup.getChildAt(index).visible = true;
          }
        };
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