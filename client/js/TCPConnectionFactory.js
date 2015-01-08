define([], function(){

	function TCPConnectionFactory(){
	}

	TCPConnectionFactory.prototype.createSocket = function(host, port) {
		// More concrete implementations can be added in here later
		var connection = new WebSocket("ws://"+host+":"+port);

		return connection;
	};


	return TCPConnectionFactory;
});