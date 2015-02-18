/*
 *  A Network layer class, takes care of communicating with a remote server
 *  and parsing data into game commands.
 */

define(['gamemessageevent', 'TCPConnectionFactory', 'util', 'lib/bison'], 
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
    this.isListening = true;
    
    if(typeof config !== 'undefined'){
      this.config = config;
    }else{
      //Default config options
      this.config  = {
        transferMethod: 0, //binary
        pingPollFrequency: 3000,
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
      connection.binaryType = "arraybuffer";

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
      if(this.isListening){
        var msgObj = this.parseMessage(e);
        if(msgObj.action == Util.EVENT_ACTION.WELCOME){
          this.receiveWelcomeMessage(msgObj.data);
        }else if(msgObj.action == Util.EVENT_ACTION.PING){
          this.receivePingMessage(msgObj);
        }else{
          this.stateUpdate(msgObj);
        }
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
      // console.log(msgObj.data, msgObj.data.length);
      for (var i = 0; i < msgObj.data.length; i+=4) {
        
        var x = msgObj.data[i];
        var y = msgObj.data[i+1];
        var r = msgObj.data[i+2];
        var id = msgObj.data[i+3];
        // console.log(msgObj.action, x,y,r,id);
        msgObjsArr.push(new GameMessageEvent(msgObj.action,
                              [x,y,r,id], msgObj.timeStamp));
      };

      // console.log(msgObjsArr.length);
      
      // msgObjsArr.push(msgObj);
      
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
        var ts = this.lastPingSentAt;
        var ping = Math.abs(msg.timeStamp - ts);
        //TODO - Add timezone validation, latency will not work 
        //for clients in timezones different from the server
        var timezoneOffset = (new Date()).getTimezoneOffset();
        // console.log(timezoneOffset - (msg.data[1]));
        var latency = Math.abs(msg.timeStamp - msg.data[0]);
        this.pingCallback.call(this.callbackContext, ping, latency);
      }     
    },

    /**
     * @public
     * Enables client polling for packet travel time
     * @param  {Boolean} disable - If true, this will stop the polling if it is running
     */
    enablePingPolling: function(disable){
      if(typeof disable == 'undefined'){
        disable = false;
      }
      var self = this;
      if(!disable){
        this.pingPollingIntervalId = setInterval(function(){
          self.lastPingSentAt = Date.now();
          var data = new GameMessageEvent(Util.EVENT_ACTION.PING, null, self.lastPingSentAt);
          self._sendMessage(data);
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
     * @param  {GameMessageEvent}
     */
    _sendMessage: function(msg){
      if(this.connected && this.connection){
        var data = msg.prepareForTransfer(this.config.transferMethod);
        if(data){
          return this.connection.send(data);
        }
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
      var data = new GameMessageEvent(Util.EVENT_INPUT.MOUSE_CLICK, 
                                                              [x,y]);
      this._sendMessage(data);
    },

    /**
     * Sends a keyboard keypress message to the server
     * @param  {int} code They key code of the pressed key
     */
    sendKeypressMessage: function(code){
      var data = new GameMessageEvent(Util.EVENT_INPUT.KEYBOARD_KEYPRESS,
                                                                  [code, code, code]);
      this._sendMessage(data);
    },

    /**
     * Parse a server message
     * Messages are sent in binary format
     * @param  {MessageEvent} msg Incoming server message
     * @return {Object} parsedData
     */
    parseMessage: function(e){
      var dw = new DataView(e.data);
      var action = dw.getInt8(0) // first element indicates the action
      var data = null;
      if(dw.buffer.byteLength > 1){
        var bytesPerValue = dw.getInt8(1);
        data = new Array((dw.buffer.byteLength-2)/bytesPerValue);
        for (var i = 0,j=2; i < data.length; i++,j+=bytesPerValue) {
          if(bytesPerValue == 8){
            data[i] = dw.getFloat64(j);
          }else if(bytesPerValue == 4){
            data[i] = dw.getFloat32(j);
          }else if(bytesPerValue == 2){
            data[i] = dw.getInt16(j);
          }else if(bytesPerValue == 1){
            data[i] = dw.getInt8(j);
          }
        };
      }
      var ts = Date.now();
      var msgObj = new GameMessageEvent(action,
                              data, ts);

      return msgObj;
    }

  };
  return GameClient;
})