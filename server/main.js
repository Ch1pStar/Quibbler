var fs = require('fs');
var Core = require('./core.js');


main();

function main() {
  getConfigFile(process.argv[2], function(config) {
      if(config) {
          console.log(config);
          var c = new Core(config);
      } else {
          console.error("Server cannot start without a configuration file.");
          process.exit(1);
      }
  });
}

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
