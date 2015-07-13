/**
 * AudioManager - Audio system manager, extends IManager
 */
define(['../core/imanager', 'players/player', 'players/team', '../util'], function(IManager, Player, Team, Util){

	var PlayerManager = IManager.extend({

		init: function(){
			this._super();
			this.players = [];
			this.teams = [];

			this.subscribedEvents[Util.EVENT_ACTION.PLAYER_CONNECTED] = this.playerConnected;
		},

		playerConnected: function(e){
			console.log(e);
			var pid = e.data[0];
			this.addTeam(pid, 0xF28511);
			this.addPlayer(pid, pid, false);
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