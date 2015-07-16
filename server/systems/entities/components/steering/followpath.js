var BaseSteering = require('./basesteering.js');
var Vec2 = require('../../../../lib/vectormath.js');

function FollowPath (movement) {
  this.movement = movement;
  this.path = [];

  this.currentPathNodeIndex = 0;

  this.arrivalTolerance = 16;

  this.idle = true;
}

//Steering Behaviors implements the basic steering class
FollowPath.prototype = new BaseSteering();


FollowPath.prototype.calculateRealSteering = function(resultVector) {

  if(this.path.length<1){
    resultVector = [[0,0],0];
    return resultVector;
  }

  var toNode = [];
  var pos = this.movement.getPosition();
  Vec2.subtract(this.nextWayPoint(),pos,toNode);
  var distance = Vec2.len(toNode);
    
  if(distance <= this.arrivalTolerance){
    //waypoint reached, move to next one
    this.currentPathNodeIndex++;
    
    if(this.currentPathNodeIndex >= this.path.length){
      this.idle = true;
      this.currentPathNodeIndex = 0;
      this.path = [];
      resultVector = [[0,0],0];
      return resultVector;
    }else{
      this.idle = false;
    }
  }

  //calc seek velocity
  Vec2.normalize(toNode,toNode);
  Vec2.scale(toNode, this.getActualLimiter().maxAcceleration, toNode);
  resultVector[0] = toNode;


  resultVector[1] = .0;

  return resultVector;
};

FollowPath.prototype.nextWayPoint = function() {
  var node = this.path[this.currentPathNodeIndex];
  return node.slice();
};

FollowPath.prototype.setPath = function(path) {
  this.path = path;
};

module.exports = FollowPath;