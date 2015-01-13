var net = require("net");


var server = net.createServer(function(s){

   console.log(s.remoteAddress);

   // s.write('Ello govner!', function(){
   // 		console.log("Message sent to client %s!", s.remoteAddress);
   // });

   // setTimeout(function(){
   // 		s.write("How's goin?", function(){
   // 			console.log("Message sent to client %s!", s.remoteAddress);		
   // 		});
   // }, 5000);



	s.on('data', function(data){
		console.log(data.toString());
	})

	s.on('end', function(){
		console.log("Connection closed!");
	})

});

server.listen(3002, function(){
    console.log("Listening(3002)....");
});

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log(err);
  console.log("Node NOT Exiting...");
});