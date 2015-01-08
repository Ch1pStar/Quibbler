define(['ServerMessage', 'TCPConnectionFactory'], function(ServerMessage, TCPConnectionFactory){


	var GameClient = function(){
		this.connection = null;
		this.callbackContext = null;
	};

	GameClient.prototype = {
		connect: function(host, port, callbackContext){
			if(typeof callbackContext === 'undefined'){
				console.error("A  callback context is required to deliver server messages");
			}
			this.callbackContext = callbackContext;
			var gameClient = this;

			var connFactory = new TCPConnectionFactory();
			var connection = connFactory.createSocket(host, port);

			connection.onmessage = function(e){
				console.log("Received data: %s", e.data);
				var parsedData = JSON.parse(e.data);
				gameClient.stateUpdate(parsedData);

				connection.send('asdas');
			};

			this.connection = connection;

		},

		stateUpdate: function(data){
			var msgObj = new ServerMessage(data.action, data.data, (new Date()).getTime());
			//sanitize data
			this.stateUpdateCallback.call(this.callbackContext, msgObj);
		},

		onStateUpdate: function(callback){
			this.stateUpdateCallback = callback;
		}
	}

	return GameClient;
})