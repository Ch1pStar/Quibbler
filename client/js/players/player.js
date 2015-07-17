define(['../util', '../gamemessageevent'], function(Util, NetworkEvent){
	var Player = Class.extend({

		init: function(team, id, isPlayingPlayer){
			if(typeof isPlayingPlayer == 'undefined'){
				isPlayingPlayer = false;
			}
			this.isPlayingPlayer = isPlayingPlayer;
			this.id = id;
			this.team = team;
		},

	});
	return Player
});