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

define(['jquery','phaser', 'gameclient', 'EventQueue'], function($, Phaser, GameClient, EventQueue) {


	var Game = function(configFilePath){
		//Make this get laoded from a file async as a Promise
		this.config = {
			mapUrl: "assets/zambies.json",
			clientWindowWidth : 1216,
			serverAddress: 'localhost',
			serverPort: 3001,
			serverMessageQueueLimit: 16
		};
		
		this.game = null;
		this.init();
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

			//Connect to game server after local client is initialized and server event handlers are set
			this.connect()				
		},

		connect: function(){
			var client = new GameClient();
			var config = this.config		
			client.onStateUpdate(this.onStateUpdate);
			client.connect(config.serverAddress, config.serverPort, this);
		},

		onStateUpdate: function(data){
			this.eventQueue.push(data);
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
			this.executeEvent(this.eventQueue.next());
		
		},

		_render: function(){

		},

		executeEvent: function(e){
			if(typeof e !== 'undefined' && e !== null){
				try{
					console.log("Event executed:\n\tAction: %s\n\tData: %o", e._action, e._data);
				}catch(e){}
				finally{
					console.log("Event:\n\t%o", e);
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