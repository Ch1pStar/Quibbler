/**
 * EntityManager - Entity system manager, extends IManager
 */
define(['../core/imanager', 'entities/entity', '../util','../lib/pathfinding-browser.min'], function(IManager, Entity, Util, pf){

  var EntityManager = IManager.extend({

    init: function(game, config){
      this._super();
      this.game = game;
      this.pGame = game.game; //best line of my life
      this.tileMap = config.map;
      this.entities = [];
      this.maxEntityFrames = config.entityFrameHistoryLimit;
      this.entityLerpMsec = config.serverTickRate*config.serverUpdateInterval;
      this.serverTickRate = config.serverTickRate;
      this.entityLerpTick = config.serverUpdateInterval;

      this.subscribedEvents = {};

      this.subscribedEvents[Util.EVENT_ACTION.ENTITY_STATE_UPDATE] = this.onEntityStateUpdate;
      this.subscribedEvents[Util.EVENT_ENTITY_ACTION.REMOVE] = this.removeEnitity;
      this.subscribedEvents[Util.EVENT_ACTION.PRODUCE] = this.createEntity;

      this.pathfinder = new pf.AStarFinder({
        allowDiagonal: true,
        dontCrossCorners: true
      });
      this.pfGrid = new pf.Grid(this.tileMap.pMap.width, this.tileMap.pMap.height);
   
      var data = this.tileMap.walls.getTiles(0,0,this.tileMap.pMap.widthInPixels, this.tileMap.pMap.heightInPixels);
      for(var i in data){
        var tile = data[i];
        if(tile.index != -1){
          this.pfGrid.setWalkableAt(tile.x,tile.y, false);       
        }
      }

      this.hoverEntity = -1;

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

    showEntityPaths: function(val){
      if(typeof val == 'undefined'){
        val = true;
      }

      for(var i = 0; i<this.entities.length;i++){
        var ent = this.entities[i];
        if(ent != null && typeof ent != "undefined"){
          ent.drawPath = val;
        }
      }
    },

    onEntityStateUpdate: function(e){

      this.resetFogMask();

      var lerpPlusLatency = this.entityLerpMsec; //+ this.serverLatency;
      // var lerpTargetTime = this.pGame.time._started + (e.data[2]*(1000/60));
      // console.log(lerpTargetTime, this.pGame.time.now);
      var lerpTargetTime = e.timeStamp;
      var currEntity = this.entities[e.data[3]];
      if(currEntity!=null){

        var currEntityAttributesCount = 7;

        var currEntityResourcesLength = e.data[6];
        var currEntityResourcesArr = new Array(currEntityResourcesLength);
        for (var i = 0; i < currEntityResourcesLength; i++) {
          var currEntityResource = e.data[i+currEntityAttributesCount];
          currEntityResourcesArr[i] = currEntityResource;
        };


        var currEntitySeenByLength =currEntityResourcesLength+currEntityAttributesCount;
        var currEntitySeenByArr = new Array(currEntitySeenByLength);
        for (var i = 0; i < currEntitySeenByLength; i++) {
          var currEntitySeenBy = e.data[i+currEntityAttributesCount];
          currEntitySeenByArr[i] = currEntitySeenBy;
        };

        var currEntityPathStart = currEntitySeenByLength+currEntityAttributesCount;
        var currEntityPathLength = e.data[currEntityPathStart];
        var currEntityPathArr = new Array(currEntityPathLength || 0);

        for (var i = 0; i < currEntityPathLength; i++) {
          var pathNode = [];
          var k = ((i+1)*2)+currEntityPathStart;
          pathNode.push(e.data[k-1]);
          pathNode.push(e.data[k]);
          currEntityPathArr[i] = pathNode;
        };
        
        var currEntityLocalPath = [];
        if(currEntityPathArr.length>0){

        
          var tarNode = currEntityPathArr[currEntityPathArr.length-1];

          var grid = this.pfGrid.clone();
          var pf = this.pathfinder;
        
          var srcXTile = Math.round((e.data[0]-32/2)/32);
          var srcYTile = Math.round((e.data[1]-32/2)/32);

          currEntityLocalPath = pf.findPath(srcXTile, srcYTile, tarNode[0], tarNode[1], grid);
        }

        currEntity.frames.push({
          x:e.data[0],// + (Math.random()*300),
          y:e.data[1],// + (Math.random()*300),
          r:e.data[2],
          resources: currEntityResourcesArr,
          seenBy: currEntitySeenByArr,
          path: currEntityLocalPath,
          t:lerpTargetTime + lerpPlusLatency,
          tick: e.tick + this.entityLerpTick
        });

        if(currEntity.frames.length >= this.maxEntityFrames) {
            currEntity.frames.splice(0,1);
        }
      }
    },

    isEnemy: function(ent){
      return this.playingPlayer.team.id != ent.owner.team.id;
    },

    createEntity: function(e){
      var data = e.data;
      var owner = this.game.playerManager.players[data[5]];
      console.log(data);
      var config = {
        x: data[0],
        y: data[1],
        r: data[2],
        id: data[3],
        visionRadius: data[4],
        type: 10,
        owner: owner,
        manager: this
      };
      this.entities[data[3]] = new Entity(this.pGame, config);
      // this.entities.push(new Entity(this.pGame, config));
    },

    removeEnitity: function(e){
      var entity = this.entities[e.data[0]];
      if(entity){
        entity.remove();
        this.entities[e.data[0]] = null;
      }
    },

    process: function(){

      for (var i = 0; i < this.entities.length; i++) {
        var currEntity = this.entities[i];
        if(currEntity!= null){
          currEntity.update();
        }
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
        var currEntity = this.entities[i];
        if(currEntity!= null){
          currEntity.draw();
        }
      };
    },

  });

  return EntityManager;
});
