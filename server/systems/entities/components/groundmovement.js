var Vec2 = require('../../../lib/vectormath.js');


var SeekAI = require('./seekai.js');
var FindPathAI = require('./findpathai.js');

function GroundMovement(entity, movementAI){

  this.entity = entity;

  this.moveOrders = [];
  this.nextMoveOrder = null;

  this.maxSpeed = 200;
  this.maxAcceleration = 200;

  this.useQueue = false;


  //abomination of a factory
  //bleh
  this.aiTypes = {
    seek: SeekAI,
    fp: FindPathAI
  };
  this.movementAI = new this.aiTypes[movementAI](this);

}

GroundMovement.prototype.process = function(time) {
  this.computeNextMoveCommand();
  this.movementAI.move(time); 
};



GroundMovement.prototype.computeNextMoveCommand = function() {
  if(this.moveOrders.length>0){
    if(this.useQueue){
      if(this.movementAI.steering.idle){
        this.nextMoveOrder = this.moveOrders.shift();
        var tarY = this.nextMoveOrder[1]+16;
        var tarX = this.nextMoveOrder[0]+16;
        this.movementAI.setTarget([tarX, tarY]);
      }
    }else{
        this.nextMoveOrder = this.moveOrders[this.moveOrders.length-1];
        var tarY = this.nextMoveOrder[1]+16;
        var tarX = this.nextMoveOrder[0]+16;
        this.movementAI.setTarget([tarX, tarY]);
        this.moveOrders = [];
    }
    
  }
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