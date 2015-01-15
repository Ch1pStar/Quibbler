/**
 * A factory class that creates a WS(TCP) connection to a remote host
 */
define([], function(){

  /**
   * @constructor
   */
  function TCPConnectionFactory(){
  }

  /**
   * Factory method to create the connection
   * @param  {String}
   * @param  {ing}
   * @return {WebSocket}
   */
  TCPConnectionFactory.prototype.createSocket = function(host, port) {
    // More concrete implementations can be added in here later(MozWebSocket)
    var connection = new WebSocket("ws://"+host+":"+port);

    return connection;
  };

  return TCPConnectionFactory;
});