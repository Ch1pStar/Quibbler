var Vec2 = require('../../../lib/vectormath.js');


var SeekAI = require('./seekai.js');
var FindPathAI = require('./findpathai.js');

function GroundMovement(entity, movementAI){

  this.entity = entity;

  this.target = null;

  this.maxSpeed = 200;
  this.maxAcceleration = 200;
  this.maxAngularSpeed = 8;

  this.useQueue = false;


  //abomination of a factory
  //bleh
  this.aiTypes = {
    seek: SeekAI,
    fp: FindPathAI
  };
  this.movementAI = new this.aiTypes[movementAI](this);

  this.onTargetReached = {
    ctx: null,
    cb: null
  };

}

GroundMovement.prototype.process = function(time) {
  this.movementAI.move(time); 
};

GroundMovement.prototype.setTarget = function(position, ctx, cb) {

  var mapTileHeight = this.entity.manager.map.tileHeight;
  var mapTileWidth = this.entity.manager.map.tileWidth;

  //find the closest tile for PF
  var xTile = Math.round( (position[0]-mapTileWidth/2) /mapTileWidth);
  var yTile = Math.round( (position[1]-mapTileHeight/2) /mapTileHeight);

  var xTileX = xTile*mapTileWidth;
  var yTileY= yTile*mapTileHeight;

  var xTileOffset = position[0] - xTileX;
  var yTileOffset = position[1] - yTileY;
  if(!this.entity.manager.pfGrid.isWalkableAt(xTile,yTile)){
    //TODO return an error later on
    return;
  }

  var tarY = yTileY+mapTileWidth/2;
  var tarX = xTileX+mapTileHeight/2;
  this.movementAI.setTarget([tarX, tarY, xTileOffset, yTileOffset]);
  this.onTargetReached.ctx = ctx;
  this.onTargetReached.cb = cb;
};

//surely there is a better way to do this
GroundMovement.prototype.changeMovementAI = function(movementAI) {
  if(typeof this.aiTypes[movementAI] != 'undefined'){
    console.log("chaning ai to - %s", movementAI);
    this.movementAI = new this.aiTypes[movementAI](this);
  }else{
    console.err("Unsupported movementAI specified.");
  }
};

GroundMovement.prototype.getPath = function() {
  
  if(this.movementAI.steering.path){
    return this.movementAI.steering.path;
  }
  return [];
};


GroundMovement.prototype.getTilePath = function() {
  var mapTileHeight = this.entity.manager.map.tileHeight;
  var mapTileWidth = this.entity.manager.map.tileWidth;

  var path = this.getPath();
  var res = [];
  for (var i = 0; i < path.length; i++) {
    var node = path[i];
    var srcXTile = Math.round((node[0]-mapTileHeight/2)/mapTileHeight);
    var srcYTile = Math.round((node[1]-mapTileWidth/2)/mapTileWidth);
    res.push([srcXTile, srcYTile]);
  };
  return res;
};


GroundMovement.prototype.getPosition = function() {
  return [this.entity.body.position[0],this.entity.body.position[1]];
};


GroundMovement.prototype.getVelocity = function() {
  return this.entity.body.velocity;
};

GroundMovement.prototype.getAngularVelocity = function() {
  return this.entity.body.angularVelocity;
};

GroundMovement.prototype.getAngle = function() {
  return this.entity.body.angle;
};

module.exports = GroundMovement;