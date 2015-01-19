/**
 * Base entity class
 */
define([], function(){

  var Entity = Class.extend({
    init: function(pGame, x, y){
      this.pGame = pGame;
      console.log(this.pGame);
      // this.obj = this.pGame.add.sprite(x, y, 'simple_tile');
    },

    update: function(){

    },

    draw: function(){
    	// console.log(this.x, this.y);
    }

  });

  return Entity;
});