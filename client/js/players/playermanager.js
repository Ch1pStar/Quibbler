/**
 * AudioManager - Audio system manager, extends IManager
 */
define(['../core/imanager', 'players/player', 'players/team'], function(IManager, Player, Team){

	var PlayerManager = IManager.extend({

		init: function(){
			this._super();
			this.players = [];
			this.teams = [];
		},
		getPlayingPlayer: function(){
			for (var i = 0; i < this.players.length; i++) {
				if(this.players[i].isPlayingPlayer){
					return this.players[i];
				}
			};
		},

		addPlayer: function(teamId, id, isPlayingPlayer){
			var team = this.teams[teamId];
			var p = new Player(team, id, isPlayingPlayer);
			this.players.push(p);
			this.fireEvent('player-added', p);
			
			if(isPlayingPlayer){
				this.fireEvent('playingplayer-change', p);
			}
		},

		changePlayingPlayer: function(pid){
			var p;
			for (var i = 0; i < this.players.length; i++) {
				this.players[i].isPlayingPlayer = false;
				if(this.players[i].id == pid){
					p = this.players[i];
				}
			};
			if(typeof p == 'undefined'){
				throw new Error('Non-existing player id specified!');
			}
			p.isPlayingPlayer = true;
			this.fireEvent('playingplayer-change', p);
		},

		addTeam: function(id, color){
			this.teams.push(new Team(id, color));
		},

		process: function(){
			
		}
	});

	return PlayerManager;
});