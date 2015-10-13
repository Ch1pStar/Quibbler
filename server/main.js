var fs = require('fs');
var Core = require('./core.js');


c = {};
main();

function main() {
  //load default config file if none is specified
  var path = process.argv[2]?process.argv[2]:'./config/core.json';
  getConfigFile(path, function(config) {
      if(config) {
        c = new Core(config);
      }else{
        console.error("Server cannot start without a configuration file.");
        process.exit(1);
      }
  });
}

function getConfigFile(path, callback) {
  fs.readFile(path, 'utf8', function(err, json_string) {
      if(err){
        console.error("Could not open config file:", err.path);
        callback(null);
      } else{
        callback(JSON.parse(json_string));
      }
  });
}
