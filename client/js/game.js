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

define(['jquery','phaser', 'gameclient', 'eventqueue', 'gamemessageevent', 
  'util','entities/entitymanager', 'audio/audiomanager', 'lib/underscore-min', 'core/class'],
      function($, Phaser, GameClient, EventQueue, GameMessageEvent, Util,  
                                                EntityManager, AudioManager) {

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
        gameClientType: Util.GAME_CLIENT_TYPE.NETWORK_GAME, // 0 - network game, 1 - single player, 2 - replay
        gameClientSettings: {
          serverAddress: window.location.hostname,
          serverPort: 3001,
        },
        incomingClientMessageLimit: 2000
      };
    }
    
    this.game = null;
    this.client = null;
    this.serverPing = 0;
    this.eventQueue = new EventQueue(this.config.incomingClientMessageLimit);
    this.entityManager = null;
    this.audioManager = null;
    this.gameSystems = null;
    
    //Dev testing stuff, detele when done
    this.cc = 0;

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

      //Connect to game server after local client is initialized 
      //and server event handlers are set
      this.connect();

      var self = this;
      
      window.onfocus = function(){
        self.client.isListening = true;
      }

      window.onblur = function(){
        self.client.isListening = false;
      }

    },

    /**
     * @private
     * Creates a GameClient object
     * and connects to the remote server used to communicate
     * @return {[type]}
     */
    connect: function(){
      var config = this.config
      var client;
      if(this.config.gameClientType == Util.GAME_CLIENT_TYPE.NETWORK_GAME){
        client = new GameClient();
        client.onWelcomeMessage(this.handleWelcomeMessage);
        client.onPingMessage(this.handlePingUpdate);
        client.onStateUpdate(this.enqueueEvent);
        client.connect(config.gameClientSettings.serverAddress, config.gameClientSettings.serverPort, this);
      }
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

      //Init teams, players and entities with starting server data
      //...
    },

    /**
     * @public
     * Ping update handler
     * @param  {int}
     */
    handlePingUpdate: function(ping, latency){
      this.serverPing = ping;
      $('#ping-tracker').text(ping);
      $('#latency-tracker').text(latency);
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


      this.game.load.image('simple_tile', 'assets/simple_tile.png');

      this.game.time.advancedTiming = true;
      this.game.time.desiredFps = 60;
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

      game.input.onDown.add(this.mouseClickHandler, this);
      game.input.keyboard.addCallbacks(this, this.keyboardDownHandler, 
                      this.keyboardUpHandler, this.keyboardPressHandler);


      this.entityManager = new EntityManager(this.game);
      this.audioManager = new AudioManager();
      this.gameSystems = [this.entityManager, this.audioManager];
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

      for (var i = 0; i < this.gameSystems.length; i++) {
        this.gameSystems[i].process();
      };

      //Handle input devices(mouse, keyboard) current state
      this.resolveInputState();
    },

    /**
     * @private
     * Render method used to render game state
     */
    render: function(){
      $('#fps-tracker').text(this.game.time.fps);


      for (var i = 0; i < this.gameSystems.length; i++) {
        this.gameSystems[i].processRender();
      };
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

        if(action == Util.EVENT_ACTION.ENTITY_STATE_UPDATE){
          this.entityManager.eventQueue.push(e);
        }else if(action == Util.EVENT_ACTION.PRODUCE){
          this.entityManager.createEntity(e.data[0], e.data[1]);
          this.cc++;
          console.log(this.cc);
        }else if(action == Util.EVENT_ACTION.RESOURCE_CHANGE){

        }
      }catch(e){
        console.error(e.message);
      }
      finally{
        // console.log('Event: %s\n\t%o', e.action, e);
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