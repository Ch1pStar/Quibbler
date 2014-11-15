var fs = require('fs'),
	configPath = './server/config.json';

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

getConfigFile(configPath, function(config) {
	if(config) {
		main(config);
	} else {
		console.error("Server cannot start without any configuration file.");
		process.exit(1);
	}
});



function main(config) {

    var ws = require("ws"),
        WebSocketServer = require('ws').Server, 
        wss = new WebSocketServer({port: config.port});

    //INIT WORLD


    wss.on('connection', function(ws){
        console.log("Client connected");
        //CREATE NEW PLAYER ON NEW CONNECTION
    });

    process.on('uncaughtException', function (e) {
        log.error('uncaughtException: ' + e);
    });
}