var BaseSteering = require('./basesteering.js');
var Vec2 = require('../../../../lib/vectormath.js');
var Event = require('../../../../lib/event.js');
var consts = require('../../../../lib/const.js');

function FollowPath (movement) {
  this.movement = movement;
  this.path = [];

  this.currentPathNodeIndex = 0;

  this.arrivalTolerance = 2;

  this.idle = true;

  this.emptyVector = [[0,0],0];

  this.targetOrientation = 0;
}

//Steering Behaviors implements the basic steering class
FollowPath.prototype = new BaseSteering();


FollowPath.prototype.calculateRealSteering = function(resultVector) {
  if(this.path.length<1){
    resultVector = this.emptyVector;
    return resultVector;
  }

  var toNode = [];
  var pos = this.movement.getPosition();
  Vec2.subtract(this.nextWayPoint(),pos,toNode);
  var distance = Vec2.len(toNode);

  this.targetOrientation = Vec2.vectorToAngle(toNode);
    
  if(distance <= this.arrivalTolerance){
    //waypoint reached, move to next one
    this.currentPathNodeIndex++;

    //calculate target orientation for next path node
    // console.log("--------");
    // this.targetOrientation = Vec2.vectorToAngle(toNode);
    // console.log(toNode, this.targetOrientation);

    if(this.currentPathNodeIndex >= this.path.length){
      //path is finished
      this.idle = true;
      this.currentPathNodeIndex = 0;
      this.path = [];
      resultVector = this.emptyVector;
      


      var targetReachedEvent = new Event(consts.EVENT_ENTITY_STATE_CHANGE.TARGET_REACHED, this, {});
      this.movement.entity.eventBroadcast(targetReachedEvent);
      //call path finished callback
      // if(this.movement.onTargetReached){
      //   this.movement.onTargetReached.cb.call(this.movement.onTargetReached.ctx);
      // }
      return resultVector;
    }else{
      this.idle = false;
    }
  }

  var rotation = Vec2.wrapAngleAroundZero(this.targetOrientation - this.movement.getAngle());

  var rotationSize = rotation < .0 ? -rotation : rotation;

  if(rotationSize < .1){
    //start moving when we are facing the target
    //calc seek velocity
    Vec2.normalize(toNode,toNode);
    Vec2.scale(toNode, this.getActualLimiter().maxAcceleration, toNode);
    resultVector[0] = toNode;
    resultVector[1] = .0;
  }else{
    resultVector[0] = [0,0];
    var targetRotation = this.getActualLimiter().maxAngularSpeed;
    targetRotation *= rotation/rotationSize;
    resultVector[1] = targetRotation; 
  }
  return resultVector;
};

FollowPath.prototype.nextWayPoint = function() {
  var node = this.path[this.currentPathNodeIndex];
  return node.slice();
};

FollowPath.prototype.setPath = function(path) {
  this.currentPathNodeIndex = 0;
  this.path = path;
};

module.exports = FollowPath;