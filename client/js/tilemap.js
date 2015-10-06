/**
 * TileMap - Decorator class for Phaser.TileMap
 */
define([], function(){

  var TileMap = Class.extend({
    init: function(map){
      this.pMap = map;
      this.game = this.pMap.game;

      this.addResources();

      var  layer = this.pMap.createLayer('Background');
      layer.resizeWorld();

      // var road = this.pMap.createLayer('Road');

      // road.resizeWorld();

      var walls = this.pMap.createLayer('RoadWalls');
      walls.resizeWorld();
      walls.visible = false;
      walls.renderable = false;
      this.walls = walls;
    },

    addResources: function(){

      this.pMap.addTilesetImage('bg');
      this.pMap.addTilesetImage('road_pattern');
      this.pMap.addTilesetImage('road_corners');
      // this.pMap.addTilesetImage('Grass');
      // this.pMap.addTilesetImage('Water');
      // this.pMap.addTilesetImage('ground_1x1');

    }

  });

  return TileMap;
});
