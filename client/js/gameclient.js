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
			var self = this;

			var connFactory = new TCPConnectionFactory();
			var connection = connFactory.createSocket(host, port);

			connection.onmessage = function(e){
				// console.log("Received data: %s", e.data);
				var parsedData = JSON.parse(e.data);

				// self.receiveWelcomeMessage(parsedData);
				self.stateUpdate(parsedData);

				// connection.send('asdas');
			};

			this.connection = connection;

		},

		//Private tmp(possibly) function
		_sentMessage: function(msg){
			this.connection.send(msg);
		},

		//This method receives the raw state update snapshot from the server and chops it into event messages for the game to handle
		stateUpdate: function(data){
			var msgObj = new ServerMessage(data.action, data.data, (new Date()).getTime());
			//sanitize data
			this.stateUpdateCallback.call(this.callbackContext, msgObj);
		},

		receiveWelcomeMessage: function(data){
			this.welcomeCallback.call(this.callbackContext, data);
		},

		onWelcomeMessage: function(callback){
			this.welcomeCallback = callback;
		},

		onStateUpdate: function(callback){
			this.stateUpdateCallback = callback;
		}
	}

	return GameClient;
})