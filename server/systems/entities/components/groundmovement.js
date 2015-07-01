function GroundMovement(entity){

  this.entity = entity;

  this.moveOrders = [];
  this.path = [];
  this.nextMoveOrder = null;
  this.currPathNodeIndex = 0;
  this.pathRadius = 5;
  
  this.target = null;
  this.speed = 5;
}


GroundMovement.prototype.process = function() {


  this.getCurrentPathTarget();


  if(this.target != null){

    this.entity.body.force = [0,0];
    this.entity.body.velocity = [0,0];
    this.entity.body.angularVelocity = 0;
    this.entity.body.angularForce = 0;


    var tarX = (this.target[0]*32) + 16;
    var tarY = (this.target[1]*32) + 16;

    if(this.entity.body.position[0]<tarX){
      this.entity.body.position[0]+=this.speed;
    }else if(this.entity.body.position[0]>tarX){
      this.entity.body.position[0]-=this.speed;  
    }

    if(this.entity.body.position[1]<tarY){
      this.entity.body.position[1]+=this.speed;
    }else if(this.entity.body.position[1]>tarY){
      this.entity.body.position[1]-=this.speed;  
    }

    // this.entity.body.wakeUp();
    // var speed = 100;
    // var angle = Math.atan2(tarY - this.entity.body.position[1], tarX - this.entity.body.position[0]);
    // this.entity.body.rotation = angle;
    // this.entity.body.force[0] = Math.cos(angle) * speed;
    // this.entity.body.force[1] = Math.sin(angle) * speed;

  }

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

    if (this.distance(this.target) <= this.pathRadius) {
      this.currPathNodeIndex ++;

      //Path destination is reached
      if (this.currPathNodeIndex >= this.path.length) {
        this.targetReached();
      }
    }
  }
};

GroundMovement.prototype.targetReached = function() {
  this.currPathNodeIndex = 0;
  this.path = [];
  this.nextMoveOrder = null;

  var tarX = (this.target[0]*32) + 16;
  var tarY = (this.target[1]*32) + 16;
  this.entity.body.position[0] = tarX;
  this.entity.body.position[1] = tarY;
};


GroundMovement.prototype.distance = function (target) {
  var srcXTile = Math.round(this.entity.body.position[0]);
  var srcYTile = Math.round(this.entity.body.position[1]);
  var tarXTile = (target[0]*32)+32/2;
  var tarYTile = (target[1]*32)+32/2;

  return Math.sqrt((srcXTile - tarXTile) * (srcXTile - tarXTile)  + (srcYTile - tarYTile) * (srcYTile - tarYTile));
};

module.exports = GroundMovement;