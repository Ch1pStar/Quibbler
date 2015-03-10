var fs = require('fs'),
  configPath = './server/config.json';
var net = require('net');
var BISON = require('bison');
var GameMessageEvent = require('./gamemessageevent.js');

var gameUtils = require('./GameUtils.js');

function getConfigFile(path, callback) {
    fs.readFile(path, 'utf8', function(err, json_string) {
        if(err) {
            console.error("Could not open config file:", err.path);
            callback(null);
        } else {
            callback(JSON.parse(json_string));
        }
    });
}
var wss;
function main(config) {

    var ws = require("ws"),
        WebSocketServer = require('ws').Server;

    wss = new WebSocketServer({port: config.port});

    //INIT WORLD

    var stream = net.connect(3002);

    wss.on('connection', function(ws){
        console.log("Client connected - %s",  ws._socket.remoteAddress);

        if(ws.supports.binary){
          ws.transferType = 0;
        }else{
          ws.transferType = 1;
        }

        sendWelcomeMessage(ws);
        
        for (var i = 0; i < units.length; i++) {
            var cu =  units[i];

            //data.unshift(data.length); could be used here instead for the first element, but will reduce performance
            var data = [6, cu.x, cu.y, cu.r, cu.visionRadius, cu.id, cu.owner];
            sendProduceUnit(data, ws);
        };  
        

        // setTimeout(function(){
        //   clearInterval(tt);
        // }, 5000);
        

        ws.on('message', function(msg, flags){

            var data = parseMessage(ws, msg, flags);

            if(data){
              if(data.action == gameUtils.EVENT_ACTION.PING){
                  pingReply(ws);
              }else if(data.action == gameUtils.EVENT_INPUT.INPUT_BUFFER){
                resolveInput(data.data);
              }
              // }else{
              //     stream.write(data.prepareForTransfer(0));
              // }
            }            
        })

        ws.on('close', function(){
            console.log("Client disconnected from server!");
        });
    });

    process.on('uncaughtException', function (e) {
        console.error('uncaughtException: ' + e);
    });
}

function simStateUpdate(x, y, id, t, ws){
  sendMessageToClient(ws, new GameMessageEvent(gameUtils.EVENT_ACTION.ENTITY_STATE_UPDATE, [x, y, id,t]));
}

function sendEntitiesSnapshot(data, ws) {
  sendMessageToClient(ws, new GameMessageEvent(gameUtils.EVENT_ACTION.ENTITY_STATE_UPDATE, data), 2);  
}

function sendProduceUnit(data, ws){
  sendMessageToClient(ws, new GameMessageEvent(gameUtils.EVENT_ACTION.PRODUCE, data));
}

function sendWelcomeMessage(ws) {
  sendMessageToClient(ws, new GameMessageEvent(gameUtils.EVENT_ACTION.WELCOME, [tickCount, tickRate, updateInterval]));
}

function sendMessageToClient(ws, msg, bytesPerValue) {
  var data = msg.prepareForTransfer(ws.transferType, bytesPerValue);
  if(data){
    return ws.send(data);
  }
}

function resolveInput(buffer) {
  var len = buffer[0];
  for (var i = 0, j=1; i < len; i++, j++) {
    console.log(j);
    if(buffer[j] == gameUtils.EVENT_INPUT.MOUSE_CLICK){
      var data = [buffer[j++], buffer[j++]];
    }else if(buffer[j] == gameUtils.EVENT_INPUT.KEYBOARD_KEYPRESS){
      var data = [buffer[j++]];
    }
  };
  
}

function parseMessage(ws, msg, flags) {
  var msgObj;
  try{
    if(ws.transferType == 0){
      var data = null;
      if(msg.length > 1){
        var bytesPerValue = msg.readInt8(1);
        data = new Array((msg.length - 2)/bytesPerValue);
        for (var i = 0,j=2; i < data.length; i++,j+=bytesPerValue) {
          if(bytesPerValue == 8){
            data[i] = msg.readDoubleBE(j);
          }else if(bytesPerValue == 4){
            data[i] = msg.readFloatBE(j);
          }else if(bytesPerValue == 2){
            data[i] = msg.readInt16BE(j);
          }else if(bytesPerValue == 1){
            data[i] = msg.readInt8(j);
          }
        }
      }     
      msgObj = new GameMessageEvent(msg.readInt8(0), data);
    }else{
        var data = JSON.parse(msg);
        var msgObj = new GameMessageEvent(msg.a, msg.d);
    }
    return msgObj;
  }catch(e){
    console.error("Error parsing client message");
    return false;
  }finally{
    // console.log(msgObj);
  }
}

function pingReply(ws) {
    var date = new Date(); 
    var ts = date.getTime();
    var timeZone = date.getTimezoneOffset(); 
    var d = [ts, timeZone];
    var data = new GameMessageEvent(gameUtils.EVENT_ACTION.PING,
                              d, ts);
    
    // var data = new GameMessageEvent(gameUtils.EVENT_ACTION.PING, null, ts);
    sendMessageToClient(ws, data, 8);
}

function startServer() {
    getConfigFile(configPath, function(config) {
        if(config) {
            if(typeof process.argv[2] != 'undefined'){
                config.mapUrl = process.argv[2];
            }
            console.log(config);
            main(config);
        } else {
            console.error("Server cannot start without a configuration file.");
            process.exit(1);
        }
    });  
}

startServer();

var tickRate = 1000/60;
var tickCount = 0; 
var updateInterval = 3; //send a client update every updateInterval ticks

var tarX = 50,
    tarY = 50;

var units = [];
for (var i = 0; i < 20; i++) {
  units[i] = {
    x: 32*3,
    y: 0,
    r: 0,
    id: i,
    directionX: 1,
    directionY: 1,
    owner: i%2,
    seenBy: [(i%2)+1],
    visionRadius: 3
  };
};

var t = true;

setInterval(function(){
  var updatedUnits = [];
  var xStep = (Math.random()*5)+7;
  var yStep = (Math.random())+7;
  var xAccelerationMultiplier = 1;
  var yAccelerationMultiplier = 1;

    // if((tickCount*tickRate)%1000 == 0){
    //   if(t){
    //     t = false;
    //   }else{
    //     t = true;
    //   }
    // }

  for (var i = 0; i < units.length; i++) {
    var now = Date.now();
    var u = units[i];

    if(u.x > 850){
      u.directionX = -1;
      xAccelerationMultiplier = (Math.random()*3);
    }else if(u.x < 50){
      u.directionX = 1;
    }

    if(u.y > 550){
      u.directionY = -1;
      yAccelerationMultiplier = (Math.random()*3);
    }else if(u.y < 50){
      u.directionY = 1;
    }

    u.x += (yStep*u.directionX)*xAccelerationMultiplier;
    u.y += (yStep*u.directionY)*yAccelerationMultiplier;

    // if(tickCount%12 == 0){
    //   u.r +=0.7;
    // }

    // if((tickCount*tickRate)%1000 == 0){
    //   if(t){
    //     if(u.owner == 1){
    //       u.seenBy = [1];
    //     }else if(u.owner == 0){
    //       u.seenBy = [0];
    //     }
    //   }else{
    //     if(u.owner == 1){
    //       u.seenBy = [0];
    //     }else if(u.owner == 0){
    //       u.seenBy = [1];
    //     }
    //   }
    // }

    if(tickCount%updateInterval == 0){

      updatedUnits.push(4 + u.seenBy.length);
      updatedUnits.push(u.x);
      updatedUnits.push(u.y);
      updatedUnits.push(u.r);
      updatedUnits.push(u.id);
      for (var j = 0; j < u.seenBy.length; j++) {
        updatedUnits.push(u.seenBy[j]);
      };
    }
  }

  if(tickCount%updateInterval == 0){
    for (var j = 0; j < wss.clients.length; j++) {
      var ws = wss.clients[j];
      sendEntitiesSnapshot(updatedUnits, ws);
    };
  }
  tickCount++;
}, tickRate);