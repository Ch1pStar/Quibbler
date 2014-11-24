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

define(['jquery','phaser'], function($, Phaser) {


	var Game = function(){
		//Test case, config will be provided by the server
		var config = {
			mapUrl: "assets/big_map.json"
		};
		this.init(config);
	};

	Game.prototype = {

		init : function(config){
			var gameObj = this;
			this.game = new Phaser.Game(($(window).width()-100), 640, Phaser.AUTO, '', { 
				preload: function(){
					gameObj.preload(config);
				},
				create: this.create, 
				update: this.update, 
				render: this.render, 
				forceSetTimeOut: false 
			});

			Phaser.RequestAnimationFrame(this.game, true);
		},

		preload : function(config) {
			this.game.load.tilemap('map', config.mapUrl, null, Phaser.Tilemap.TILED_JSON);
		    this.game.load.image('ground_1x1', 'assets/ground_1x1.png');
		    this.game.load.image('Grass', 'assets/FeThD.png');
		    this.game.load.image('Water', 'assets/water_1x1.png');
		},

		create : function() {
			var game = this.game;
			
		    game.physics.startSystem(Phaser.Physics.P2JS);

		    game.stage.backgroundColor = '#2d2d2d';

		    map = game.add.tilemap('map');

		    map.addTilesetImage('Grass');
		    map.addTilesetImage('Water');
		    map.addTilesetImage('ground_1x1');
		    
		    var  layer = map.createLayer('BG');
		    layer.resizeWorld();

		    var walls = map.createLayer('Tile Layer 1');
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

		update : function() {

		}
	};

	return Game;
});