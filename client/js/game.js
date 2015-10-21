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
        'eventdispatcher', '../assets/cursor/cursors.js', 'lib/underscore-min',],
      function($, Class, Phaser, GameClient, EventQueue,
                GameMessageEvent, Util, EntityManager,
                AudioManager, TileMap, PlayerManager, EventDispatcher, cursors) {

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

    this.playingPlayerId;

    this.mouseDownHandlers = [this.leftClickDown, this.scrollClickDown, this.rightClickDown];
    this.mouseUpHandlers = [this.leftClickUp, this.scrollClickUp, this.rightClickUp];


    this.mouseAbilities = [
      {bind:0, a:this.leftClickUp, quickCast: true},
      {bind:1, a:this.attack, quickCast: false, cursor: 'attack_default'},
      {bind:2, a:this.testAbility, quickCast: true}
    ];


    //s, a, c, v, h, z, down, right, up, left
    // this.abilityBinds = [83, 65, 67, 86, 72, 40, 39, 38, 37];
    this.abilities = [
      { bind:83, a:this.spawn, quickCast: true},
      { bind:65, a:this.attack, quickCast: false, cursor:'attack_default' },
      { bind:67, a:this.clearAllEntities, quickCast: true},
      { bind:86, a:this.clearSelectedEntities, quickCast: true},
      { bind:72, a:this.clearCurrentSelection, quickCast: true},
      { bind:90, a:this.testAbility, quickCast: true, cursor: 'attack_default'},
      { bind:40, a:this.moveCameraDown, quickCast: true},
      { bind:39, a:this.moveCameraRight, quickCast: true},
      { bind:38, a:this.moveCameraUp, quickCast: true},
      { bind:37, a:this.moveCameraLeft, quickCast: true},
    ];

    this.selectedAbility = null;

    this.highlightUnit = null;

    this.cursor = 'default';

    //Call after all properties are declared
    this.init();
  };

  Game.prototype = {

    /**
     * @public
     * Creates the game world and starts the game loop
     */
    init: function(){

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

      this.playingPlayerId = data[3];

      this.existingPlayers = [];
      for (var i = 5; i < 5+data[4]; i++) {
        this.existingPlayers.push(data[i]);
      };

      // var wWidth = $(window).width();
      // var gameWidth = 32*38;//tmp
      // var gameWidth = this.config.clientWindowWidth;
      // if(wWidth < gameWidth){
        // gameWidth = wWidth - 50;
      // }

      // var wHeight = $(window).height();
      // var gameHeight = 32*22;//tmp

      var gameWidth = window.innerWidth;
      // var gameHeight = window.innerHeight;
      var gameHeight = 720;
      // console.log(gameWidth, gameHeight);
      console.log(document.body.clientHeight);

      this.game = new Phaser.Game(gameWidth, gameHeight, Phaser.AUTO, 'client-wrapper', {
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
      this.game.load.image('road_pattern', 'assets/road_pattern.png');
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

      // game.physics.startSystem(Phaser.Physics.P2JS);

      game.stage.backgroundColor = '#2d2d2d';



      this.map = new TileMap(game.add.tilemap('map'));
      // this.map.addResources();


      //  Set the tiles for collision.
      //  Do this BEFORE generating the p2 bodies below.
      // this.map.pMap.setCollisionBetween(1, 12);

      //  Convert the tilemap layer into bodies.
      //  Only tiles that collide (see above) are created.
      //  This call returns an array of body objects which
      //  you can perform addition actions on if required.
      //  There is also a parameter to control optimising the map build.
      // var wallTiles = game.physics.p2.convertTilemap(this.map.pMap, walls);

      // game.physics.p2.setBoundsToWorld(true, true, true, true, false);

      game.input.onUp.add(this.mouseUpClickHandler, this);
      game.input.onDown.add(this.mouseDownClickHandler, this);
      game.input.keyboard.addCallbacks(this, this.keyboardDownHandler,
                      this.keyboardUpHandler, this.keyboardPressHandler);

      var c = game.canvas;
      c.oncontextmenu = function(e){
          e.preventDefault();
      };
      c.onselectstart = function(e){
          e.preventDefault();
      };

      this.setCursor(this.cursor);

      //TODO add prevent default  for scroll click

      var highlightTile = this.game.add.graphics(0,0);
      highlightTile.lineStyle(1, 0x000000, 1); // width, color (0x0000FF), alpha (0 -> 1) // required settings
      highlightTile.drawRect(0, 0, 32, 32); // x, y, width, height
      this.highlightTile = highlightTile;


      //tmp
      this.highlightTile.visible = false;
      this.showHightlightTile = false;


      var selectionRekt = this.game.add.graphics(0,0);
      selectionRekt.lineStyle(1, 0x118811,1);
      selectionRekt.drawRect(0,0,1,1);
      selectionRekt.alpha = .3;
      this.selectionRekt = selectionRekt;

      this.initGameSystems();
    },

    initGameSystems: function(){
      var entityManagerConfig = {
        serverTickRate: this.serverTickRate,
        entityFrameHistoryLimit: 4,
        serverUpdateInterval: this.serverUpdateInterval,
        map: this.map
      };
      this.entityManager = new EntityManager(this, entityManagerConfig);
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
        
        //add existing players
        for (var i = 0; i < this.existingPlayers.length; i++) {
          var pid = this.existingPlayers[i];
          this.playerManager.addTeam(pid, 0xF28511);
          this.playerManager.addPlayer(pid, pid, false);
        };

        //add current player
        this.playerManager.addTeam(this.playingPlayerId, 0x00FF00);
        this.playerManager.addPlayer(this.playingPlayerId, this.playingPlayerId, true);
        

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

    updateSelection: function(){
      var selection = [];

      for(var e in this.entityManager.entities){
        var ent = this.entityManager.entities[e];
        if(ent!=null && ent.selected){
          selection.push(ent.id);
        }
      }
      selection.unshift(selection.length);
      var e = new GameMessageEvent(Util.EVENT_PLAYER_COMMAND.SELECTION, selection);
      this.inputBuffer.push(e);
    },

    /**
     * @private
     * Render method used to render game state
     */
    render: function(){
      $('#fps-tracker').text(this.game.time.fps);

      var selectionVal = "";
      this.highlightUnit = null;
      for (var i = 0; i < this.entityManager.entities.length; i++) {
        var ent = this.entityManager.entities[i];
        if(ent != null && ent.selected){
          selectionVal += ent.id +", ";
          if(this.highlightUnit == null){
            this.highlightUnit = ent;
            $('#hp-value').text(this.highlightUnit.hp);
          }
        }
      };

      $('#selection-value').text(selectionVal);


      //This is broken, will not display proper time if the client is lagging(not running at 60 fps)
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

      // if(this.cursor !='default'){
      //   this.setCursor('default');
      // }

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
      var xTile = Math.round( (mousePointer.worldX-32/2) /32);
      var yTile = Math.round( (mousePointer.worldY-32/2) /32);
      //TODO - Add actual UI interaction
      $('#cursor-tracker').text("X: "+mousePointer.worldX+"("+xTile+") Y: "+mousePointer.worldY+"("+yTile+")");

      this.highlightTile.x = xTile*32;
      this.highlightTile.y = yTile*32;

      this.drawSelectionRect();
      this.updateCameraDrag();

      // console.log(this.serverUpdateInterval);
      if(this.tickCount%this.serverUpdateInterval == 0){
        this.sendUserInput();
      }
    },

    sendUserInput: function(){
      if(this.inputBuffer.length > 0){
        this.client.sendInputBuffer(this.inputBuffer);
        this.inputBuffer = [];
      }
    },

    drawSelectionRect: function(){
      if(this.selectionDrag){
        var pointer = this.game.input.mousePointer;
        var distanceV = [this.selectionRekt.x-pointer.x, this.selectionRekt.y-pointer.y];

        this.selectionRekt.scale.x = (-distanceV[0])*.5;
        this.selectionRekt.scale.y = (-distanceV[1])*.5;

        this.updateDragSelection();
      }
    },

    updateDragSelection: function(){

      //TODO - FIX, only down right selection works
      var slct = this.selectionRekt;

      for (var i = 0; i < this.entityManager.entities.length; i++) {
        var ent = this.entityManager.entities[i];
        if(ent!=null){ 
          var left = slct.x
          var right = (slct.x+slct.width*2);
          var top = slct.y;
          var bottom = (slct.y+slct.height*2);

          if(ent.owner.id == this.playingPlayerId && Phaser.Rectangle.intersectsRaw(ent.obj.getBounds(), left, right, top, bottom)) {
            ent.setSelected(true);
          }else{
            ent.setSelected(false);
          }
        }
      };

    },

    updateCameraDrag: function(){
      if(this.cameraDrag){
        this.game.camera.x = this.game.input.mousePointer.x;
        this.game.camera.y = this.game.input.mousePointer.y;
        console.log("camera is being dragged");
      }
    },

    leftClickDown: function(pointer){
      //if we're trying to use an ability, disable selection
      if(this.selectedAbility != null){
        return;
      }
      // console.log("begin selection at %d,%d", pointer.x,pointer.y);
      this.selectionDrag = true;
      this.selectionRekt.x = pointer.x;
      this.selectionRekt.y = pointer.y;

      this.selectionRekt.visible = true;

      //hide highlight tile
      if(this.showHightlightTile){
        this.highlightTile.visible = false;
      }
    },

    leftClickUp: function(pointer){
      if(this.selectedAbility != null){
        console.log("non quick cast");
        this.selectedAbility.call(this, pointer);
        this.selectedAbility = null;
        this.setCursor('default');
      }
      if(this.selectionDrag){
        this.selectionDrag = false;
        this.selectionRekt.x = 0;
        this.selectionRekt.y = 0;
        this.selectionRekt.visible = false;
        

        //show highlight tile
        if(this.showHightlightTile){
          this.highlightTile.visible = true;
        }
        // console.log("end drag at %d,%d", pointer.x, pointer.y);
      }
      console.log("left click");
    },

    scrollClickDown: function(pointer){
      // console.log("begin camera drag");
      // this.cameraDrag = true;
      

      // this.game.camera.follow(this.highlightTile);
    },

    scrollClickUp: function(pointer){
      // `("end camera drag");
      // this.cameraDrag = false;
      

      // this.game.camera.unfollow(this.highlightTile);

      // console.log("scroll click");
      // console.log(this.game.camera.x);

      // //send queued move command
      // var e = new GameMessageEvent(Util.EVENT_PLAYER_COMMAND.UNIT_MOVE, [pointer.x, pointer.y,1]);
      // this.inputBuffer.push(e);
    },

    rightClickDown: function(pointer){

    },

    rightClickUp: function(pointer){
      console.log("right click");
      //move command
      var abilityIndex = 1;
      this.sendAbilityCommand(abilityIndex);
      // var eventMessage = new GameMessageEvent(Util.EVENT_PLAYER_COMMAND.UNIT_ABILITY, [this.game.input.mousePointer.x, this.game.input.mousePointer.y, abilityIndex]);
      // this.inputBuffer.push(eventMessage);
    },

    mouseDownClickHandler: function(pointer){
      this.mouseDownHandlers[pointer.button].call(this, pointer);
    },

    /**
     * Mouse click handler
     * @param  {Phaser.MousePointer} pointer The MousePointer object
     */
    mouseUpClickHandler: function(pointer){
      for (var i = 0; i < this.mouseAbilities.length; i++) {
        if(pointer.button == this.mouseAbilities[i].bind){
          var ab = this.mouseAbilities[i];
          if(ab.quickCast){
            ab.a.call(this, this.game.input.mousePointer);
          }else{
            if(!ab.cursor) ab.cursor = "default";
            this.setCursor(ab.cursor);
            this.selectedAbility = ab.a;
          }
        }
      };
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
      console.log(e.keyCode);
      for (var i = 0; i < this.abilities.length; i++) {
        if(e.keyCode == this.abilities[i].bind){
          var ab = this.abilities[i];
          if(ab.quickCast){
            ab.a.call(this, this.game.input.mousePointer);
          }else{
            if(!ab.cursor) ab.cursor = "default";
            this.setCursor(ab.cursor);
            this.selectedAbility = ab.a;
          }
        }
      };
    },

    keyboardPressHandler: function(keyAsChar){

    },

    spawn: function(target){
      var abilityIndex = 1;
      this.sendGlobalAbilityCommand(this.highlightTile.x, this.highlightTile.y, abilityIndex);
    },

    attack: function(target){
      var abilityIndex = 0;
      this.sendAbilityCommand(abilityIndex);
    },

    testAbility: function(pointer){
      var abilityIndex = 2;
      this.sendAbilityCommand(abilityIndex);
    },

    clearAllEntities: function(){
      var abilityIndex = 0
      this.sendGlobalAbilityCommand(0,0,abilityIndex);
    },

    clearSelectedEntities: function(){
      var abilityIndex = 2
      this.sendGlobalAbilityCommand(0,0,abilityIndex);
    },

    clearCurrentSelection: function(){
      //clear current selection
      for (var i = 0; i < this.entityManager.entities.length; i++) {
        var ent = this.entityManager.entities[i];
        if(ent !=null){
          ent.setSelected(false);
        }
      };
    },

    sendAbilityCommand: function(abilityIndex){
      if(this.entityManager.hoverEntity != -1){
        this.sendTargetAbilityCommand(this.entityManager.hoverEntity, abilityIndex);
      }else{      
        this.sendGroundAbilityCommand(this.game.input.mousePointer.x, this.game.input.mousePointer.y, abilityIndex);
      }
    },

    sendGroundAbilityCommand: function(x,y, index, useQueue){
      if(typeof index == "undefined"){
        console.error("Invalid ability index");
        return;
      }
      if(typeof useQueue == "undefined") useQueue = 0;
      var eventMessage = new GameMessageEvent(Util.EVENT_PLAYER_COMMAND.UNIT_GROUND_ABILITY, [x,y,index,useQueue]);
      this.inputBuffer.push(eventMessage);
    },

    sendTargetAbilityCommand: function(targetId, index, useQueue){
      if(typeof index == "undefined"){
        console.error("Invalid ability index");
        return;
      }
      if(typeof useQueue == "undefined") useQueue = 0;
      var eventMessage = new GameMessageEvent(Util.EVENT_PLAYER_COMMAND.UNIT_TARGET_ABILITY, [targetId, index, useQueue]);
      this.inputBuffer.push(eventMessage);
    },

    sendGlobalAbilityCommand: function(x,y, index){
      if(typeof index == "undefined"){
        console.error("Invalid ability index");
        return;
      }
      if(!x)x=0; if(!y)y=0;
      var eventMessage = new GameMessageEvent(Util.EVENT_PLAYER_COMMAND.GLOBAL_ABILITY, [x,y, index]);
      this.inputBuffer.push(eventMessage);
    },

    moveCameraDown: function(){
      this.game.camera.y +=14;
    },

    moveCameraUp: function(){
      this.game.camera.y -=14;
    },

    moveCameraLeft: function(){

      this.game.camera.x -=14;
    },

    moveCameraRight: function(){

      this.game.camera.x +=14;
    },

    setCursor: function(state){
      // this.game.canvas.style.cursor = "url('../assets/cursor/"+cursors[state]+"'), default";
      this.game.canvas.parentElement.style.setProperty('cursor', "url('../assets/cursor/"+cursors[state]+"'), default", 'important');
      this.cursor = state;
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
      //Add a tick stamp to the event
      e.tick = this.tickCount;
      // console.log("----Begin Event(action: %s) Dispatch at %d(%dms)----", e.action, e.tick, Math.round(e.tick*this.tickRate));
      for(var s in this.gameSystems){
        var currSystem = this.gameSystems[s];
        var subbedEvents = currSystem.getSubscribedEvents();
        var eventCallback = subbedEvents[e.action];
        if(typeof eventCallback !== 'undefined'){
          // if(e.canPropagate){
            eventCallback.apply(currSystem, [e]);
          // }
        }
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
