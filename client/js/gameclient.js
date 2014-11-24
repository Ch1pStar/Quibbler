define([], function(){


	var GameClient = function(){
	};

	GameClient.prototype = {
		connect: function(host, port, callbackObj){
				this.client = new WebSocket("ws://"+host+":"+port);

				var gameClient = this;

				this.client.onmessage = function(e){
					console.log("Received data: %s", e.data);
					gameClient.receiveConfig();
				};

				this.initCallbackObject = callbackObj;
		},
		
		receiveConfig: function(){
			var config = {
				mapUrl: "assets/big_map.json"
			};

			this.initCallbackObject.init(config);
		}
	}

	return GameClient;
})