var game;
define(['jquery', 'game'], function($, Game) {
	function initGame() {

		game = new Game('config.json');
	}
	initGame();	
});