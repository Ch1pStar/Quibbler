var FollowPath = require('./steering/followpath.js');
var MovementAI = require('./movementai.js');

function FindPathAI (movement) {
  this.movement = movement;

  this.steering = new FollowPath(movement);

  this.steeringOutput = [[0,0],0];

}

FindPathAI.prototype = new MovementAI();

FindPathAI.prototype.move = function(time) {
  
  this.applySteering(this.steering.calculateSteering(this.steeringOutput), time);
};

FindPathAI.prototype.findPathForTarget = function() {
  
  // if(this.steering.idle){
    var data = this.target;

    var grid = this.movement.entity.manager.pfGrid.clone();
    var pf = this.movement.entity.manager.pathfinder;
  
    var tarXTile = Math.round((data[0]-32/2)/32);
    var tarYTile = Math.round((data[1]-32/2)/32);

    var pos = this.movement.getPosition();
    var srcXTile = Math.round((pos[0]-32/2)/32);
    var srcYTile = Math.round((pos[1]-32/2)/32);

    // grid.setWalkableAt(srcXTile, srcYTile, true);

    var res = pf.findPath(srcXTile, srcYTile, tarXTile, tarYTile, grid);

    var resArr = [];
    for (var i = 0; i < res.length; i++) {
      var node = res[i];
      var nodeX = (node[0]*32)+16;
      var nodeY = (node[1]*32)+16;
      resArr.push([nodeX,nodeY]);
    };

    this.steering.setPath(resArr);
  // }
};


FindPathAI.prototype.setTarget = function(target) {
  this.target = target;
  this.steering.target= target;

  this.findPathForTarget();
};


module.exports = FindPathAI;