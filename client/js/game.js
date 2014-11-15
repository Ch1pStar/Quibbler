define(['jquery','lib/phaser'], function($, Phaser) {

	console.log(Phaser);
	var gameObj;

	var Game = function(){
		gameObj = new Phaser.Game(($(window).width()-100), 640, Phaser.AUTO, 'phaser-example', { preload: this.preload, create: this.create, update: this.update, render: this.render, forceSetTimeOut: true });
		Phaser.RequestAnimationFrame(game, true);
	};

	return Game;
});