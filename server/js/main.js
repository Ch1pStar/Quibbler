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

function main(config) {

    var ws = require("ws"),
        WebSocketServer = require('ws').Server, 
        wss = new WebSocketServer({port: config.port});

    //INIT WORLD

    var stream = net.connect(3002);

    wss.on('connection', function(ws){
        console.log("Client connected");

        if(ws.supports.binary){
          ws.transferType = 0;
        }else{
          ws.transferType = 1;
        }
        

        // for (var i = 0; i < 2000; i++) {
          sendProduceUnit(150, 150, ws);
        // };
        var tarX = 50,
            tarY = 50;
        var tt = setInterval(function(){
          var now = (new Date()).getTime();
          simStateUpdate(tarX, tarY, now, ws);
          if(tarX>750){
            tarX = 30;
          }else{
            tarX +=30;
            tarX +=Math.random()*50;
          }
          if(tarY > 600){
            tarY = 45;
          }else{
            tarY +=Math.random()*50;
          }
        }, 200);


        // setTimeout(function(){
        //   clearInterval(tt);
        // }, 5000);
        

        ws.on('message', function(msg, flags){

            var data = parseMessage(ws, msg, flags);

            // sendMessageToClient(ws, {a: gameUtils.EVENT_ACTION.WELCOME});

            if(data){
              if(data.action == gameUtils.EVENT_ACTION.PING){
                  pingReply(ws);
              }
              // }else{
              //     stream.write(data.prepareForTransfer(0));
              // }
            }            
        })

        ws.on('close', function(){
            console.log("Client disconnected from server!");
        })
    });

    process.on('uncaughtException', function (e) {
        console.error('uncaughtException: ' + e);
    });
}

function simStateUpdate(x, y, t, ws){
  sendMessageToClient(ws, new GameMessageEvent(gameUtils.EVENT_ACTION.ENTITY_STATE_UPDATE, [x,y,t]));
}

function sendProduceUnit(x, y, ws){
  sendMessageToClient(ws, new GameMessageEvent(gameUtils.EVENT_ACTION.PRODUCE, [x, y]));
}

function sendMessageToClient(ws, msg) {
    var data = msg.prepareForTransfer(ws.transferType);
    if(data){
      return ws.send(data);
    }
}

function parseMessage(ws, msg, flags) {
  var msgObj;
  try{
    if(ws.transferType == 0){

      var buff = new Buffer(msg);
      var data = null;
      if(buff.length > 8){
        data = new Array((buff.length - 8)/8);
        for (var i = 8, p = 0; i < buff.length - 7; i += 8, ++p){
          data[p] = buff.readDoubleLE(i);
        }
      }
      msgObj = new GameMessageEvent(buff.readDoubleLE(0), data);

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
    var date =new Date(); 
    var ts = date.getTime();
    var timeZone = date.getTimezoneOffset(); 
    var d =[ts, timeZone];
    var data = new GameMessageEvent(gameUtils.EVENT_ACTION.PING,
                              d, ts);
    
    // var data = new GameMessageEvent(gameUtils.EVENT_ACTION.PING, null, ts);
    sendMessageToClient(ws, data);
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