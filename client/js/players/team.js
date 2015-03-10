define([], function(){
	var Team = Class.extend({
		init: function(id, color) {
			if(typeof color == 'undefined'){
				color = 0xFFFFFF;
			}
			this.id = id;
			this.color = color;
		}

	});
	return Team
});