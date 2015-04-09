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
  this.moveOrders = [];
  this.path = [];
  this.currPathNode = 0;
  this.pathRadius = 20;

  this.blocking = true;
}

Entity.prototype.getNetworkAttributes = function () {
  var res = [
    this.body.position[0],
    this.body.position[1],
    this.body.angle,
    this.id,
    this.visionRadius,
    this.owner.id
  ];

  if(this.seenBy.length>0){
    res.push(this.seenBy.length);
  }
  for (var j = 0; j < this.seenBy.length; j++) {
    res.push(this.seenBy[j]);
  };

  if(this.path.length>0){
    res.push(this.path.length);
  }
  for (var j = 0; j < this.path.length; j++) {
    for (var i = 0; i < this.path[j].length; i++) {
      res.push(this.path[j][i]);
    }
  };
  res.unshift(res.length);
  return res;
};

Entity.prototype.getInitialNetworkAttributes = function () {
  var res = [
    this.body.position[0],
    this.body.position[1],
    this.body.angle,
    this.id,
    this.visionRadius,
    this.owner.id
  ];
  res.unshift(res.length);
  return res;
};

Entity.prototype.addMoveCommand = function (data) {
  this.moveOrders[0] = data;
};

Entity.prototype.computePathForNextCommand = function () {
    if(this.moveOrders.length>0){
      var data = this.moveOrders[0];

      var grid = this.manager.pfGrid.clone();
      var pf = this.manager.pathfinder;


      var tarXTile = Math.round( (data[0]-32/2) /32);
      var tarYTile = Math.round( (data[1]-32/2) /32);

      var srcXTile = Math.round( (this.body.position[0]-32/2) /32);
      var srcYTile = Math.round( (this.body.position[1]-32/2) /32);

      var res = pf.findPath(srcXTile, srcYTile, tarXTile, tarYTile, grid);

      this.path = res;
      // console.log(srcXTile,srcYTile);
      // console.log(tarXTile, tarYTile);
      // console.log(res);
    }
};

Entity.prototype.getCurrentPathTarget = function () {
  var target = undefined;

  if (this.path.length>0) {
    if (this.currPathNode >= this.path.length) {
      this.currPathNode = this.path.length - 1;
    }

    target = this.path[this.currPathNode];

    if (this.distance(target) <= this.pathRadius) {
      this.currPathNode += 1;

      if (this.currPathNode >= this.path.length) {
        this.currPathNode = this.path.length - 1;
      }
    }
  }

  return target;
};

Entity.prototype.update = function () {
  if(this.body.previousPosition[0] != this.body.position[0] || this.body.previousPosition[1] != this.body.position[1]){
    this.stateChanged = true;
  }
  this.computePathForNextCommand();

  var target = this.getCurrentPathTarget();


  if(typeof target !== 'undefined'){
    var tarX = target[0]*32;
    var tarY = target[1]*32;



    if(this.distance(this.path[this.path.length-1])==0){
      this.body.force = [0,0];
      this.body.velocity = [0,0];
      // console.log(this.body.position);
      // this.path = [];
    }else{
      this.body.wakeUp();
      var speed = 100;
      var angle = Math.atan2(tarY - this.body.position[1], tarX - this.body.position[0]);
      this.body.rotation = angle;
      this.body.force[0] = Math.cos(angle) * speed;
      this.body.force[1] = Math.sin(angle) * speed;

    }

  }

  this.seenBy = [];
  for(var p in this.manager.core.ps.players){
    //tmp
    if(!this.manager.core.ps.players[p].isAI){
      this.seenBy.push(this.manager.core.ps.players[p].id);
    }
  }
};

Entity.prototype.distance = function (target) {
  var srcXTile = Math.round( (this.body.position[0]-32/2) /32);
  var srcYTile = Math.round( (this.body.position[1]-32/2) /32);

  return Math.sqrt((srcXTile - target[0]) * (srcXTile - target[0])  + (srcYTile - target[1]) * (srcYTile - target[1]));
};
module.exports = Entity;
