/*
 *  A Network layer class, takes care of communicating with a remote server
 *  and parsing data into game commands.
 */
define(['ServerMessage', 'TCPConnectionFactory', 'util'], function(ServerMessage, TCPConnectionFactory, Util){

	var GameClient = function(config){
		this.connection = null;
		this.connected = false;
		this.pingPolling = false;
		this.pingPollingIntervalId = null;
		this.callbackContext = null;
		this.welcomeCallback = null;
		this.stateUpdateCallback = null;
		this.pingCallback = null;
		
		if(typeof config !== 'undefined'){
			this.config = config;
		}else{
			this.config = null;
		}

		this.config  = {pingPollFrequency: 1000};
	};

	GameClient.prototype = {
		connect: function(host, port, callbackContext){
			if(typeof callbackContext === 'undefined'){
				console.error("A  callback context is required to deliver server messages!");
			}
			if(this.welcomeCallback == null || this.stateUpdateCallback == null){
				console.error("Welcome message and state update callbacks are required to deliver server messages!");	
			}
			if(this.pingCallback == null){
				console.warn("Missing ping callback, this feature will be unavailable!");
			}

			this.callbackContext = callbackContext;
			var self = this;

			var connFactory = new TCPConnectionFactory();
			var connection = connFactory.createSocket(host, port);

			connection.onmessage = function(e) {self.onMessage(e);};
			connection.onopen = function() {self.onOpen();};
			connection.onclose = function() {self.onClose();};

			this.connection = connection;
		},

		enablePingPolling: function(disable){
			if(typeof disable == 'undefined'){
				disable = false;
			}

			var self = this;
			if(!disable){
				this.pingPollingIntervalId = setInterval(function(){
					self._sentRawMessage	(JSON.stringify({action: Util.EVENT_ACTION.PING}))
				}, this.config.pingPollFrequency);
				this.pingPolling = true;
			}else{
				if(this.pingPolling && this.pingPollingIntervalId != null){
					clearInterval(this.pingPollingIntervalId);
					this.pingPolling = false;
				}
			}

		},

		onOpen: function(){
			this.connected = true;
			this.enablePingPolling();
		},

		onClose: function(){
			this.connected = false;
		},

		onMessage: function(e){
			// console.log("Received data: %s", e.data);
			var parsedData = JSON.parse(e.data);

			if(parsedData.action == Util.EVENT_ACTION.WELCOME){
				this.receiveWelcomeMessage(parsedData);
			}else if(parsedData.action == Util.EVENT_ACTION.PING){
				this.receivePingMessage(parsedData);
			}else{
				this.stateUpdate(parsedData);
			}

			// connection.send('asdas');
		},

		//Private only(possibly) function
		_sentRawMessage: function(msg){
			if(this.connected && this.connection){
				return this.connection.send(msg);
			}
			console.error("No connection.");
		},

		//This method receives the raw state update snapshot from the server and chops it into events for the game to handle
		stateUpdate: function(data){
			//sanitize data
			var msgObj = new ServerMessage(data.action, data.data, (new Date()).getTime());
			var msgObjsArr = [];

			/* 
			 * TODO Add actual logic - create game process event messages from the server snapshot
			 */
			msgObjsArr.push(msgObj);
			


			if(this.stateUpdateCallback != null){
				for (var i = 0; i < msgObjsArr.length; i++) {
					this.stateUpdateCallback.call(this.callbackContext, msgObjsArr[i]);			
				};
			}else{
				console.error("Received a server update, but missing a state update callback");
			}
		},

		receiveWelcomeMessage: function(data){
			if(this.welcomeCallback != null){
				this.welcomeCallback.call(this.callbackContext, data);
			}else{
				console.error("Received a server welcome message, but missing a callback");
			}
		},

		receivePingMessage: function(msg){
			if(this.pingCallback != null){
				var now = (new Date()).getTime();
				var ts = msg.data.time;
				var ping = Math.abs(now - ts);
				this.pingCallback.call(this.callbackContext, ping);
			}			
		},

		onWelcomeMessage: function(callback){
			this.welcomeCallback = callback;
		},

		onPingMessage: function(callback){
			this.pingCallback = callback;
		},

		onStateUpdate: function(callback){
			this.stateUpdateCallback = callback;
		}
	}

	return GameClient;
})