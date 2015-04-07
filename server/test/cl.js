var ws = require('ws');



var ws = ws.connect('ws://localhost:3100');

ws.on('open', function(){
  ws.send('spawn');
});

ws.on('message', function(e){
  console.log(e);
});

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
  	ws.send(chunk);
  }
});
