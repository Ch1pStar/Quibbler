/*
 *  A Network layer class, takes care of communicating with a remote server
 *  and parsing data into game commands.
 */

define(['gamemessageevent', 'TCPConnectionFactory', 'util'], 
      function(GameMessageEvent, TCPConnectionFactory, Util){

  /**
   * @constructor
   * @param {Object}
   */
  var GameClient = function(config){
    this.connection = null;
    this.connected = false;
    this.pingPolling = false;
    this.pingPollingIntervalId = null;
    this.callbackContext = null;
    this.welcomeCallback = null;
    this.stateUpdateCallback = null;
    this.pingCallback = null;
    this.lastPingSentAt = 0;
    
    if(typeof config !== 'undefined'){
      this.config = config;
    }else{
      //Default config options
      this.config  = {
        pingPollFrequency: 1000,
        incomingPacketDelay: 0
      };
    }

  };

  GameClient.prototype = {

    /**
     * @public
     * Connect to the remote server
     * @param  {String}
     * @param  {String}
     * @param  {Object}
     */
    connect: function(host, port, callbackContext){
      if(typeof callbackContext === 'undefined'){
        console.error('A  callback context is required '+ 
                        'to deliver server messages!');
      }
      if(this.welcomeCallback == null || this.stateUpdateCallback == null){
        console.error('Welcome message and state update callbacks '+
                      'are required to deliver server messages!'); 
      }
      if(this.pingCallback == null){
        console.warn('Missing ping callback, this feature will be unavailable!');
      }

      this.callbackContext = callbackContext;
      var self = this;

      var connFactory = new TCPConnectionFactory();
      var connection = connFactory.createSocket(host, port);

      connection.onmessage = function(e) {
        var delay = self.config.incomingPacketDelay;
        if(delay > 0){
          setTimeout(function(){
            self.onMessage(e);
          },delay);
        }else{
          self.onMessage(e);
        }
      };
      connection.onopen = function() {self.onOpen();};
      connection.onclose = function() {self.onClose();};

      this.connection = connection;
    },

    /**
     * @public
     * Enables client polling for packet travel time
     * @param  {Boolean}
     */
    enablePingPolling: function(disable){
      if(typeof disable == 'undefined'){
        disable = false;
      }

      var self = this;
      if(!disable){
        this.pingPollingIntervalId = setInterval(function(){
          self._sendRawMessage(JSON.stringify({a: Util.EVENT_ACTION.PING}));
          self.lastPingSentAt = (new Date()).getTime();
        }, this.config.pingPollFrequency);
        this.pingPolling = true;
      }else{
        if(this.pingPolling && this.pingPollingIntervalId != null){
          clearInterval(this.pingPollingIntervalId);
          this.pingPolling = false;
        }
      }

    },

    /**
     * @private
     * Callback for the 'open' event
     */
    onOpen: function(){
      this.connected = true;
      this.enablePingPolling();
    },

    /**
     * @private
     * Callback for the 'close' event
     */
    onClose: function(){
      this.connected = false;
    },

    /**
     * @private
     * Callback for the 'message' event
     * @param  {MessageEvent}
     */
    onMessage: function(e){
      // console.log('Received data: %s', e.data);
      var parsedData = JSON.parse(e.data);
      var msgObj = new GameMessageEvent(parsedData.a, 
                    parsedData.d, (new Date()).getTime());

      if(msgObj.action == Util.EVENT_ACTION.WELCOME){
        this.receiveWelcomeMessage(msgObj);
      }else if(msgObj.action == Util.EVENT_ACTION.PING){
        this.receivePingMessage(msgObj);
      }else{
        this.stateUpdate(msgObj);
      }
    },

    /**
     * @private
     * Receives the raw state update snapshot from the server 
     * and chops it into events for the game to handle
     * @param  {Object}
     */
    stateUpdate: function(msgObj){
      //sanitize data
      var msgObjsArr = [];

      /* 
       * TODO Add actual logic - 
       * create game process event messages from the server snapshot
       */
      msgObjsArr.push(msgObj);
      
      //Push generated events to core process message queue
      if(this.stateUpdateCallback != null){
        for (var i = 0; i < msgObjsArr.length; i++) {
          this.stateUpdateCallback.call(this.callbackContext, msgObjsArr[i]); 
        };
      }else{
        console.error('Received a server update, '+
          'but missing a state update callback!');
      }
    },

    /**
     * @private
     * Forwards a welcome message to the game process
     * @param  {Object}
     */
    receiveWelcomeMessage: function(data){
      if(this.welcomeCallback != null){
        this.welcomeCallback.call(this.callbackContext, data);
      }else{
        console.error('Received a welcome message, but missing a callback!');
      }
    },


    /**
     * @private
     * Handles and forwards a ping response message from the server
     * to the specified callback
     * @param  {Object}
     */
    receivePingMessage: function(msg){
      if(this.pingCallback != null){
        var ts = msg.data.t;
        // var ts = this.lastPingSentAt;
        var ping = Math.abs(msg.timeReceived - ts);
        this.pingCallback.call(this.callbackContext, ping);
      }     
    },

    /**
     * @public
     * Welcome message callback setter
     * @param  {Function}
     */
    onWelcomeMessage: function(callback){
      this.welcomeCallback = callback;
    },

    /**
     * @public
     * Ping response message callback setter
     * @param  {Function}
     */
    onPingMessage: function(callback){
      this.pingCallback = callback;
    },

    /**
     * @public
     * State update callback setter
     * @param  {Function}
     */
    onStateUpdate: function(callback){
      this.stateUpdateCallback = callback;
    },

    /**
     * @private
     * Send a raw message to the server
     * @param  {String}
     */
    _sendRawMessage: function(msg){
      if(this.connected && this.connection){
        return  this.connection.send(msg);
      }else{
        console.error('No connection to remote server!');
      }
    },

    /**
     * Sends a mouse click message to the server
     * @param  {int} x X coordinate of the click 
     * @param  {int} y Y coordinate of the click
     */
    sendClickMessage: function(x, y){
      var data = {
        i: Util.EVENT_INPUT.MOUSE_CLICK,
        d: {
          x:x,
          y:y
        }
      };
      this._sendRawMessage(JSON.stringify(data));
    },

    /**
     * Sends a keyboard keypress message to the server
     * @param  {int} code They key code of the pressed key
     */
    sendKeypressMessage: function(code){
      var data = {
        i: Util.EVENT_INPUT.KEYBOARD_KEYPRESS,
        d: {
          c:code
        }
      };
      this._sendRawMessage(JSON.stringify(data));
    }

  };

  return GameClient;
})