var BasicArrive = require('./steering/basic_tmp.js');
var Vec2 = require('../../../lib/vectormath.js');

function GroundMovement(entity){

  this.entity = entity;

  this.moveOrders = [];
  this.path = [];
  this.nextMoveOrder = null;
  this.currPathNodeIndex = 0;
  this.pathRadius = 5;
  
  // this.target = null;
  this.speed = 5;


  //steering stuff
  this.steeringBahavior = new BasicArrive(this, 
    [this.entity.body.position[0],this.entity.body.position[1]]
  );
  this.steeringOutput = [[0,0],0];



  this.maxSpeed = 200;
  this.maxAcceleration = 200;
}

GroundMovement.prototype.applySteering = function(steering, time) {
  
  var vel = this.entity.body.velocity;
  Vec2.scale(vel, time, vel);
  Vec2.add(vel, steering[0], vel);
  Vec2.limit(vel, this.maxSpeed, vel);
};


GroundMovement.prototype.process = function(time) {

  this.steeringBahavior.calculateSteering(this.steeringOutput);

  this.applySteering(this.steeringOutput, time);
  console.log(this.entity.body.velocity);
  // console.log(this.entity.manager.physics.lastTimeStep);

  this.getCurrentPathTarget();

  this.computeMoveNextCommand();
  this.computePathForNextCommand();
};

GroundMovement.prototype.computeMoveNextCommand = function() {
  if(this.moveOrders.length>0 && this.nextMoveOrder == null){
    this.nextMoveOrder = this.moveOrders[0];
    this.moveOrders = [];
  }
};

GroundMovement.prototype.computePathForNextCommand = function () {

    if(this.nextMoveOrder != null){
      var data = this.nextMoveOrder;

      var grid = this.entity.manager.pfGrid.clone();
      var pf = this.entity.manager.pathfinder;
    
      var tarXTile = Math.round((data[0]-32/2)/32);
      var tarYTile = Math.round((data[1]-32/2)/32);

      var srcXTile = Math.round((this.entity.body.position[0]-32/2)/32);
      var srcYTile = Math.round((this.entity.body.position[1]-32/2)/32);

      // grid.setWalkableAt(srcXTile, srcYTile, true);

      var res = pf.findPath(srcXTile, srcYTile, tarXTile, tarYTile, grid);

      this.path = res;
    }

};

GroundMovement.prototype.getCurrentPathTarget = function () {
  this.target = null;

  if (this.path.length>0) {
    if (this.currPathNodeIndex >= this.path.length) {
      this.currPathNodeIndex = this.path.length - 1;
    }

    this.target = this.path[this.currPathNodeIndex];

    var tarX = (this.target[0]*32) + 16;
    var tarY = (this.target[1]*32) + 16;
    this.steeringBahavior.target = [tarX,tarY];

    // if (this.distance(this.target) <= this.pathRadius) {
    //   this.currPathNodeIndex ++;

    //   //Path destination is reached
    //   if (this.currPathNodeIndex >= this.path.length) {
    //     this.targetReached();
    //   }
    // }
  }
};

GroundMovement.prototype.distance = function (target) {
  var srcXTile = Math.round(this.entity.body.position[0]);
  var srcYTile = Math.round(this.entity.body.position[1]);
  var tarXTile = (target[0]*32)+32/2;
  var tarYTile = (target[1]*32)+32/2;

  return Math.sqrt((srcXTile - tarXTile) * (srcXTile - tarXTile)  + (srcYTile - tarYTile) * (srcYTile - tarYTile));
};

GroundMovement.prototype.getPosition = function() {
  return this.entity.body.position;
};

GroundMovement.prototype.getVelocity = function() {
  return this.entity.body.velocity;
};

module.exports = GroundMovement;