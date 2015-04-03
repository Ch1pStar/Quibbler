var Body = require('p2').Body;
var Rectangle = require('p2').Rectangle;


function Entity(config){

  var body = new Body({
    position: [config.x, config.y],
    mass: 1
    // angle: config.r
  });

  var shape = new Rectangle(config.width, config.height);

  body.addShape(shape);

  this.body = body;


  this.id = config.id;
  this.manager = config.manager;
  // this.x = config.x;
  // this.y = config.y;
  // this.r = config.r;
  this.visionRadius = config.visionRadius;
  this.type = config.type;
  this.owner = config.owner;
  this.seenBy = [];
  this.stateChanged = false;
  this.path = [];
}

Entity.prototype.getNetworkAttributes = function () {
  var res = [
    6 + this.seenBy.length,
    this.body.position[0],
    this.body.position[1],
    this.body.angle,
    this.id,
    this.visionRadius,
    this.owner.id
  ];
  for (var j = 0; j < this.seenBy.length; j++) {
    res.push(this.seenBy[j]);
  };
  return res;
};

Entity.prototype.update = function () {
  if(this.body.previousPosition[0] != this.body.position[0] || this.body.previousPosition[1] != this.body.position[1]){
    this.stateChanged = true;
  }

  if(this.path.length>0){
    var nextCheckpoint = this.path[0];
    var speed = 60;
    var angle = Math.atan2(nextCheckpoint[1] - this.body.position[1], nextCheckpoint[0] - this.body.position[0]);
    this.body.rotation = angle;
    this.body.force[0] = Math.cos(angle) * speed;    // accelerateToObject
    this.body.force[1] = Math.sin(angle) * speed;
  }

  this.seenBy = [];
  for(var p in this.manager.core.ps.players){
    this.seenBy.push(this.manager.core.ps.players[p].id);
  }
};
module.exports = Entity;
