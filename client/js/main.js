var game;
define(['jquery', 'game'], function($, Game) {
  function initGame() {
    game = new Game();
    $('.player-change').click(function(){
    	var p = $(this).data('player');
    	game.playerManager.changePlayingPlayer(p);
    	return false;
    });
  }
  initGame();
});