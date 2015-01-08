define(['ServerMessage'], function(ServerMessage){


	var GameClient = function(){
		this.client = null;
		this.callbackContext = null;
	};

	GameClient.prototype = {
		connect: function(host, port, callbackContext){
			if(typeof callbackContext === 'undefined'){
				console.error("A  callback context is required to deliver server messages");
			}
			this.callbackContext = callbackContext;
			var gameClient = this;
			client = new WebSocket("ws://"+host+":"+port);

			client.onmessage = function(e){
				console.log("Received data: %s", e.data);
				var parsedData = JSON.parse(e.data);
				gameClient.stateUpdate(parsedData);

				client.send('asdas');
			};

			this.client = client;

		},

		stateUpdate: function(data){
			var msgObj = new ServerMessage(data.action, data.data, (new Date()).getTime());
			//sanitize data to application objects
			this.stateUpdateCallback.call(this.callbackContext, msgObj);
		},

		onStateUpdate: function(callback){
			this.stateUpdateCallback = callback;
		}
	}

	return GameClient;
})