/**
 * This is the core process of the game, controling all game systems.
 */

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

define(['jquery','phaser', 'gameclient', 'eventqueue', 'util'], 
      function($, Phaser, GameClient, EventQueue, Util) {

  /**
   * @public
   * @constructor
   * @param {Object}
   */
  var Game = function(config){
    if(typeof config !== 'undefined'){
      this.config = config;
    }else{
      //Default config options
      this.config = {
        mapUrl: 'assets/zambies.json',
        clientWindowWidth : 1216,
        serverAddress: window.location.hostname,
        serverPort: 3001,
        serverMessageQueueLimit: 100
      };
    }
    
    this.game = null;
    this.client = null;
    this.cursors;
    this.entities = [];
    this.serverPing = 0;
    

    //Call after all properties are declared
    this.init();
  };

  Game.prototype = {

    /**
     * @public
     * Creates the game world and starts the game loop
     */
    init: function(){
      var wWidth = $(window).width();
      var gameWidth = this.config.clientWindowWidth;
      if(wWidth < gameWidth){
        gameWidth = wWidth - 50;
      }

      this.game = new Phaser.Game(gameWidth, 704, Phaser.AUTO, '', {
        preload: this.caller(this.preload),
        create: this.caller(this.create), 
        update: this.caller(this.update), 
        render: this.caller(this.render), 
        forceSetTimeOut: false 
      });
      this.eventQueue = new EventQueue(this.config.serverMessageQueueLimit);

      //Connect to game server after local client is initialized 
      //and server event handlers are set
      this.connect()        
    },

    /**
     * @private
     * Creates a GameClient object
     * and connects to the remote server used to communicate
     * @return {[type]}
     */
    connect: function(){
      //TODO - Create the GameClient object with a factory instead
      var client = new GameClient();
      var config = this.config    
      client.onWelcomeMessage(this.handleWelcomeMessage);
      client.onPingMessage(this.handlePingUpdate);
      client.onStateUpdate(this.enqueueEvent);
      client.connect(config.serverAddress, config.serverPort, this);
      this.client = client;
    },

    /**
     * @public
     * Add a GameMessageEvent object to the command queue of the game
     * to be executed
     * @param  {GameMessageEvent}
     */
    enqueueEvent: function(e){
      this.eventQueue.push(e);
    },

    /**
     * @public
     * Welcome message handler
     * @param  {Object}
     */
    handleWelcomeMessage: function(data){
      console.log('Connected to server - %s', this.client.connection.url);

      //Init enitites with starting server data
      //...
    },

    /**
     * @public
     * Ping update handler
     * @param  {int}
     */
    handlePingUpdate: function(ping){
      this.serverPing = ping;
      $('#ping-tracker').text(ping);
    },

    /**
     * @private
     * Prelaod method used by Phaser to initialize resources
     */
    preload : function() {

      var config = this.config;
      this.game.load.tilemap('map', config.mapUrl, null, 
                              Phaser.Tilemap.TILED_JSON);
      this.game.load.image('ground_1x1', 'assets/ground_1x1.png');
      this.game.load.image('Grass', 'assets/FeThD.png');
      this.game.load.image('Water', 'assets/water_1x1.png');


      this.game.load.image('bg', 'assets/bg_tile.png');
      this.game.load.image('road', 'assets/road_pattern.png');
      this.game.load.image('road_corners', 'assets/road_corners.png');

      this.game.time.advancedTiming = true;
    },

    /**
     * @private
     * Create method used by Phaser to create initial game state
     */
    create : function() {
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

      //  Convert the tilemap layer into bodies. 
      //  Only tiles that collide (see above) are created.
      //  This call returns an array of body objects which
      //  you can perform addition actions on if required.
      //  There is also a parameter to control optimising the map build.
      var wallTiles = game.physics.p2.convertTilemap(map, walls);

      game.physics.p2.setBoundsToWorld(true, true, true, true, false);

      // this.cursors = game.input.keyboard.createCursorKeys();

      game.input.onDown.add(this.mouseClickHandler, this);
      game.input.keyboard.addCallbacks(this, this.keyboardDownHandler, 
                      this.keyboardUpHandler, this.keyboardPressHandler);
    },

    /**
     * @private
     * Update method used to move the game state a step further
     */
    update: function() {

      //Execute the queued events for the current update cycle
      if(!this.eventQueue.empty()){
        this.executeEvent(this.eventQueue.next());      
      }

      //Handle input devices(mouse, keyboard) current state
      this.resolveInputState();
    },

    /**
     * @private
     * Render method used to render game state
     */
    render: function(){
      $('#fps-tracker').text(this.game.time.fps);
    },
    
    /**
     * @private
     * Resource change command handler
     * @param  {Object}
     */
    resourceChange: function(data){
      console.log('Resource change event!');
    },

    /**
     * Client side input handler, used to highlight hovered enitites,
     * show help texts et cetera
     */
    resolveInputState: function(){
      var mousePointer = this.game.input.mousePointer;
      //TODO - Add actual UI interaction
      $('#cursor-tracker').text("X: "+mousePointer.x+" Y: "+mousePointer.y);
    },

    /**
     * Mouse click handler
     * @param  {Phaser.MousePointer} pointer The MousePointer object
     */
    mouseClickHandler: function(pointer){
      console.log("Mouse click at: %s, %s", pointer.x, pointer.y);
      this.client.sendClickMessage(pointer.x, pointer.y);
    },

    /**
     * A handler for when a key is pressed down
     * @param  {Phaser.KeyboardEvent} e
     */
    keyboardDownHandler: function(e){
    
    },

    /**
     * A handler for when a key is released
     * @param  {Phaser.KeyboardEvent} e
     */
    keyboardUpHandler: function(e){
      this.client.sendKeypressMessage(e.keyCode);
    },

    keyboardPressHandler: function(keyAsChar){
    
    },

    /**
     * Executes the given event,
     * sending necessary commands to the game components(audio, entities etc)
     * @param  {GameMessageEvent}
     */
    executeEvent: function(e){
      try{
        var action = e.action;

        if(action == Util.EVENT_ACTION.RESOURCE_CHANGE){
          // Is a resource change event needed?

        } else if(action == Util.EVENT_ACTION.PLAY_AUDIO){
          // Audio event

        }else{
          // Entity event
          var data = e.data;
          var currEntities = [];
          if(data.isBulkOrder){
            for (var i = 0; i < data.entityIds.length; i++) {
              var entity = this.entities[data.entityIds[i]];
              currEntities.push(entity);
            };
          }else{
            currEntities.push(this.entities[data.entityId]);
          }

          if(action == Util.EVENT_ACTION.MOVE){
            for (var i = 0; i < entities.length; i++) {
              currEntities[i].addMoveOrder(data.dstX, data.dstY, 
                                         data.addToEndOfQueue);
            }
          }else if(action == Util.EVENT_ACTION.ATTACK){
            var targetEntity = this.entities[data.targetId];
            for (var i = 0; i < entities.length; i++) {
              currEntities[i].addAttackOrder(targetEntity, 
                                      data.addToEndOfQueue);
            }
          }
        }
      }catch(e){
        console.error(e.message);
      }
      finally{
        console.log('Event:\n\t%o', e);
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