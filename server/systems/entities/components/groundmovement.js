var Vec2 = require('../../../lib/vectormath.js');


var SeekAI = require('./seekai.js');
var FindPathAI = require('./findpathai.js');

function GroundMovement(entity, movementAI){

  this.entity = entity;

  this.moveOrders = [];
  this.nextMoveOrder = null;

  this.maxSpeed = 200;
  this.maxAcceleration = 200;


  //abomination of a factory
  //bleh
  var aiTypes = {
    seek: SeekAI,
    fp: FindPathAI
  };
  this.movementAI = new aiTypes[movementAI](this);

}

GroundMovement.prototype.process = function(time) {
  this.computeNextMoveCommand();
  this.movementAI.move(time); 
};



GroundMovement.prototype.computeNextMoveCommand = function() {
  if(this.moveOrders.length>0 && this.movementAI.steering.idle){
    this.nextMoveOrder = this.moveOrders[0];
    this.moveOrders = [];
    
    var tarY = this.nextMoveOrder[1]+16;
    var tarX = this.nextMoveOrder[0]+16;
    this.movementAI.setTarget([tarX, tarY]);
  }
};


GroundMovement.prototype.getPath = function() {
  
  if(this.movementAI.steering.path){
    return this.movementAI.steering.path;
  }
  return [];
};


GroundMovement.prototype.getTilePath = function() {
  var path = this.getPath();
  var res = [];
  for (var i = 0; i < path.length; i++) {
    var node = path[i];
    var srcXTile = Math.round((node[0]-32/2)/32);
    var srcYTile = Math.round((node[1]-32/2)/32);
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

module.exports = GroundMovement;