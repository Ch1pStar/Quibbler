/**
 * This is the core process of the game, controling all game systems.
 */

requirejs.config({
  paths: {
    phaser:   'lib/phaser.min'
  },

  shim: {
    'phaser': {
      exports: 'Phaser'
    }
  }
});

define(['jquery','core/class', 'phaser', 'gameclient', 'eventqueue',
        'gamemessageevent','util','entities/entitymanager',
        'audio/audiomanager', 'tilemap', 'players/playermanager',
        'eventdispatcher', 'lib/underscore-min',],
      function($, Class, Phaser, GameClient, EventQueue,
                GameMessageEvent, Util, EntityManager,
                AudioManager, TileMap, PlayerManager, EventDispatcher) {

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
        mapUrl: 'assets/zambiers.json',
        clientWindowWidth : 850,
        gameClientType: Util.GAME_CLIENT_TYPE.NETWORK_GAME, // 0 - network game, 1 - single player, 2 - replay
        gameClientSettings: {
          serverAddress: window.location.hostname,
          serverPort: 3001,
        },
        incomingClientMessageLimit: 22500
      };
    }

    this.game = null;
    this.client = null;
    this.serverPing = 0;
    this.serverLatency = 0;
    this.eventQueue = new EventQueue(this.config.incomingClientMessageLimit);
    this.entityManager = null;
    this.audioManager = null;
    this.playerManager = null;
    this.gameSystems = null;
    this.inputBuffer = [];
    this.map;

    this.tickCount = 0;
    this.serverTickRate = 0;
    this.serverUpdateInterval = 0;

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
      // var wWidth = $(window).width();
      // var gameWidth = this.config.clientWindowWidth;
      // if(wWidth < gameWidth){
      //   gameWidth = wWidth - 50;
      // }
      // this.game = new Phaser.Game(gameWidth, 704, Phaser.AUTO, '', {
      //   preload: this.caller(this.preload),
      //   create: this.caller(this.create),
      //   update: this.caller(this.update),
      //   render: this.caller(this.render),
      //   forceSetTimeOut: false
      // });

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
      this.tickCount = data[0];
      this.serverTickRate = data[1];
      this.serverUpdateInterval = data[2];

      // var wWidth = $(window).width();
      var gameWidth = 1300;
      // var gameWidth = this.config.clientWindowWidth;
      // if(wWidth < gameWidth){
        // gameWidth = wWidth - 50;
      // }

      var wHeight = $(window).height();
      var gameHeight = wHeight - 250;

      this.game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, '', {
        preload: this.caller(this.preload),
        create: this.caller(this.create),
        update: this.caller(this.update),
        render: this.caller(this.render),
        forceSetTimeOut: false
      });

    },

    /**
     * @public
     * Ping update handler
     * @param  {int}
     */
    handlePingUpdate: function(ping, latency){
      this.serverPing = ping;
      this.serverLatency = latency;
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
      // this.game.load.image('road', 'assets/road_pattern.png');
      // this.game.load.image('road_corners', 'assets/road_corners.png');


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

      this.map = new TileMap(game.add.tilemap('map'));
      this.map.addResources();

      var  layer = this.map.pMap.createLayer('Background');
      layer.resizeWorld();

      // var walls = this.map.pMap.createLayer('Road');
      // walls.resizeWorld();


      //  Set the tiles for collision.
      //  Do this BEFORE generating the p2 bodies below.
      // this.map.pMap.setCollisionBetween(1, 12);

      //  Convert the tilemap layer into bodies.
      //  Only tiles that collide (see above) are created.
      //  This call returns an array of body objects which
      //  you can perform addition actions on if required.
      //  There is also a parameter to control optimising the map build.
      // var wallTiles = game.physics.p2.convertTilemap(this.map.pMap, walls);

      game.physics.p2.setBoundsToWorld(true, true, true, true, false);

      game.input.onDown.add(this.mouseClickHandler, this);
      game.input.keyboard.addCallbacks(this, this.keyboardDownHandler,
                      this.keyboardUpHandler, this.keyboardPressHandler);

      this.initGameSystems();
    },

    initGameSystems: function(){
      var entityManagerConfig = {
        serverTickRate: this.serverTickRate,
        entityFrameHistoryLimit: 4,
        serverUpdateInterval: this.serverUpdateInterval,
        map: this.map
      };
      this.entityManager = new EntityManager(this.game, entityManagerConfig);
      this.audioManager = new AudioManager();
      this.playerManager = new PlayerManager();

      this.gameSystems = [this.entityManager, this.audioManager, this.playerManager];
      try{
        this.audioManager.setEventCallback(this.audioManagerEventHandler);
        this.playerManager.setEventCallback(this.playerManagerEventHandler);
        this.entityManager.setEventCallback(this.entityManagerEventHandler);

        for (var i = 0; i < this.gameSystems.length; i++) {
          this.gameSystems[i].setEventCallbackContext(this);
        };

        this.playerManager.addTeam(0, 0xF28511);
        this.playerManager.addTeam(1, 0x00FF00);
        this.playerManager.addTeam(2, 0xDDFFDD);

        this.playerManager.addPlayer(0, 0, false);
        this.playerManager.addPlayer(1, 1, true);
        this.playerManager.addPlayer(2, 2, false);

        this.entityManager.addFogOfWar();
      }catch(e){
        console.log(e);
      }
    },

    /**
     * @private
     * Update method used to move the game state a step further
     */
    update: function() {

      //Execute the queued events for the current update cycle
      while(!this.eventQueue.empty()){
        this.executeEvent(this.eventQueue.next());
      }

      for (var i = 0; i < this.gameSystems.length; i++) {
        this.gameSystems[i].serverLatency = this.serverPing;
        this.gameSystems[i].process();
      };

      //Handle input devices(mouse, keyboard) current state
      this.resolveInputState();

      this.tickCount++;
    },

    /**
     * @private
     * Render method used to render game state
     */
    render: function(){
      $('#fps-tracker').text(this.game.time.fps);
      var elapsed = Math.floor((this.tickCount*this.serverTickRate)/1000);
      var elapsedMinutes = ('0'+Math.floor(elapsed/60)).slice(-2);
      var elapsedSeconds = ('0'+elapsed%60).slice(-2);
      $('#time-tracker').text(elapsedMinutes+':'+elapsedSeconds);
      var conStatus;
      if(this.client.connected){
        conStatus = "connected";
      }else{
        conStatus = "disconnected";
      }
      $('#conn-value').text(conStatus);



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
     * Resolves the pooled user input commands from the last update interval,
     * and used for client side input handling to highlight hovered enitites,
     * show help texts et cetera
     */
    resolveInputState: function(){
      var mousePointer = this.game.input.mousePointer;
      //TODO - Add actual UI interaction
      $('#cursor-tracker').text("X: "+mousePointer.x+" Y: "+mousePointer.y);

      if(this.tickCount%this.serverUpdateInterval == 0 && this.inputBuffer.length > 0){
        this.sendUserInput();
      }
    },

    sendUserInput: function(){
      this.client.sendInputBuffer(this.inputBuffer);
      this.inputBuffer = [];
    },

    /**
     * Mouse click handler
     * @param  {Phaser.MousePointer} pointer The MousePointer object
     */
    mouseClickHandler: function(pointer){
      console.log("Mouse click at: %s, %s", pointer.x, pointer.y);
      var e = new GameMessageEvent(Util.EVENT_INPUT.MOUSE_CLICK, [pointer.x, pointer.y]);
      this.inputBuffer.push(e);
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
      var eventMessage = new GameMessageEvent(Util.EVENT_INPUT.KEYBOARD_KEYPRESS, [e.keyCode]);
      this.inputBuffer.push(eventMessage);
    },

    keyboardPressHandler: function(keyAsChar){

    },

    audioManagerEventHandler: function(e){
      console.log(e);
    },

    playerManagerEventHandler: function(e){
      if(e.action == 'player-added'){
        console.log("player %s added!", e.data.id);
      }else if(e.action == 'playingplayer-change'){
        this.entityManager.setPlayingPlayer(e.data);
        console.log("Player %s is now the playing player!", e.data.id);
        $('#playingplayer-value').text(e.data.id);
      }
    },

    entityManagerEventHandler: function(e){
      console.log(e);
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
          // this.cc++
          this.entityManager.eventQueue.push(e);
        }else if(action == Util.EVENT_ACTION.PRODUCE){
          this.entityManager.createEntity(e.data, this.playerManager.players[e.data[5]]);
          // this.cc++;
          // console.log(this.cc);
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
