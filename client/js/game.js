requirejs.config({
  paths: {
    phaser:   'lib/phaser.min',
  },

  shim: {
    'phaser': {
      exports: 'Phaser'
    }
  }
});

define(['jquery','phaser', 'gameclient', 'EventQueue', 'util'], 
      function($, Phaser, GameClient, EventQueue, Util) {


  var Game = function(configFilePath){
    //Make this get laoded from a file async as a Promise
    this.config = {
      mapUrl: "assets/zambies.json",
      clientWindowWidth : 1216,
      serverAddress: 'localhost',
      serverPort: 3001,
      serverMessageQueueLimit: 100
    };
    
    this.game = null;
    this.client = null;
    this.init();
    this.entities = [];

    this.serverPing = 0;
  };

  Game.prototype = {

    init: function(){
      var wWidth = $(window).width();
      var gameWidth = this.config.clientWindowWidth;
      if(wWidth < gameWidth){
        gameWidth = wWidth - 50;
      }

      this.game = new Phaser.Game(gameWidth, 704, Phaser.AUTO, '', {
        preload: this.caller(this._preload),
        create: this.caller(this._create), 
        update: this.caller(this._update), 
        render: this.caller(this._render), 
        forceSetTimeOut: false 
      });

      this.eventQueue = new EventQueue(this.config.serverMessageQueueLimit);

      //Connect to game server after local client is initialized 
      //and server event handlers are set
      this.connect()        
    },

    connect: function(){
      var client = new GameClient();
      var config = this.config    
      client.onWelcomeMessage(this.handleWelcomeMessage);
      client.onPingMessage(this.handlePingUpdate);
      client.onStateUpdate(this.enqueueEvent);
      client.connect(config.serverAddress, config.serverPort, this);
      this.client = client;
    },

    enqueueEvent: function(data){
      this.eventQueue.push(data);
    },

    handleWelcomeMessage: function(data){
      console.log("Connected to server - %s", this.client.connection.url);

      //Init enitites with starting server data
      //...
    },

    handlePingUpdate: function(ping){
      this.serverPing = ping;
      $('#ping-tracker').text(ping);
    },

    _preload : function() {

      var config = this.config;
      this.game.load.tilemap('map', config.mapUrl, null, Phaser.Tilemap.TILED_JSON);
      this.game.load.image('ground_1x1', 'assets/ground_1x1.png');
      this.game.load.image('Grass', 'assets/FeThD.png');
      this.game.load.image('Water', 'assets/water_1x1.png');


      this.game.load.image('bg', 'assets/bg_tile.png');
      this.game.load.image('road', 'assets/road_pattern.png');
      this.game.load.image('road_corners', 'assets/road_corners.png');
      
      
    },

    _create : function() {
      var game = this.game;
      
        game.physics.startSystem(Phaser.Physics.P2JS);

        game.stage.backgroundColor = '#2d2d2d';

        map = game.add.tilemap('map');

        map.addTilesetImage('bg');
        map.addTilesetImage('road');
        map.addTilesetImage('road_corners');
        // map.addTilesetImage('Grass');
        // map.addTilesetImage('Water');
        // map.addTilesetImage('ground_1x1');
        
        var  layer = map.createLayer('Background');
        layer.resizeWorld();

        var walls = map.createLayer('Road');
        walls.resizeWorld();

        //  Set the tiles for collision.
        //  Do this BEFORE generating the p2 bodies below.
        map.setCollisionBetween(1, 12);

        //  Convert the tilemap layer into bodies. Only tiles that collide (see above) are created.
        //  This call returns an array of body objects which you can perform addition actions on if
        //  required. There is also a parameter to control optimising the map build.
        var wallTiles = game.physics.p2.convertTilemap(map, walls);

        game.physics.p2.setBoundsToWorld(true, true, true, true, false);
    },

    _update: function() {
      //Execute the queued events for the current update cycle
      if(!this.eventQueue.empty()){
        this.executeEvent(this.eventQueue.next());      
      }
    },

    _render: function(){

    },
    
    resourceChange: function(data){
      console.log("Resource change event!");
    },


    executeEvent: function(e){
      try{
        var action = e._action;

        if(action == Util.EVENT_ACTION.RESOURCE_CHANGE){
          // Is a resource change event needed?

        } else if(action == Util.EVENT_ACTION.PLAY_AUDIO){
          // Audio event

        }else{
          // Entity event
          var data = e._data;
          var entities = [];
          if(data.isBulkOrder){
            for (var i = 0; i < data.entityIds.length; i++) {
              var entity = this.entities[data.entityIds[i]];
              entities.push(entity);
            };
          }else{
            entities.push(this.entities[data.entityId]);
          }

          if(action == Util.EVENT_ACTION.MOVE){
            for (var i = 0; i < entities.length; i++) {
              entities[i].addMoveOrder(data.dstX, data.dstY, data.addToEndOfQueue);
            };
          }else if(action == Util.EVENT_ACTION.ATTACK){
            var targetEntity = this.entities[data.targetId];
            for (var i = 0; i < entities.length; i++) {
              entities[i].addAttackOrder(targetEntity, data.addToEndOfQueue);
            };
          }
        }
        
      }catch(e){
        console.error(e.message);
      }
      finally{
        console.log("Event:\n\t%o", e);
      } 
    },


    caller: function (fn) {
          var gameObj = this;
          return (function () {
              return fn.apply(gameObj);
          });
      }

  };

  return Game;
});