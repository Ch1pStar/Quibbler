/**
 * TileMap - Decorator class for Phaser.TileMap
 */
define([], function(){

  var TileMap = Class.extend({
    init: function(map){
      this.pMap = map;
      this.game = this.pMap.game;


      var  layer = this.pMap.createLayer('Background');
      layer.resizeWorld();

      var walls = this.pMap.createLayer('Road');
      walls.resizeWorld();

    },

    addResources: function(){

      this.pMap.addTilesetImage('bg');
      this.pMap.addTilesetImage('road');
      this.pMap.addTilesetImage('road_corners');
      // this.pMap.addTilesetImage('Grass');
      // this.pMap.addTilesetImage('Water');
      // this.pMap.addTilesetImage('ground_1x1');

    }

  });

  return TileMap;
});
