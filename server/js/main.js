var fs = require('fs'),
	configPath = './server/config.json';
var net = require("net");

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


        var cntr = 0;
        setInterval(function(){
            for (var i = 0; i < 4; i++) {
                var str = "";
                for (var j = 0; j < cntr; j++) {
                    str += j*cntr;
                };
                var data = {action: i, data: { a: str }};
                ws.send(JSON.stringify(data));
            };
            cntr++;
        }, 5000);

        ws.on('message', function(data){
            console.log('Got: %s', data.toString());
        
            stream.write(data);
        })



        ws.on('close', function(){
            console.log("Client - disconnected from server!");
        })
    });

    process.on('uncaughtException', function (e) {
        console.error('uncaughtException: ' + e);
    });
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