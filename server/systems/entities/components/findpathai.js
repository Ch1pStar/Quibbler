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

    var mapTileWidth = this.movement.entity.manager.map.tileWidth;
    var mapTileHeight = this.movement.entity.manager.map.tileHeight;

    var grid = this.movement.entity.manager.pfGrid.clone();
    var pf = this.movement.entity.manager.pathfinder;
  
    var tarXTile = Math.round((data[0]-mapTileWidth/2)/mapTileWidth);
    var tarYTile = Math.round((data[1]-mapTileHeight/2)/mapTileHeight);

    var pos = this.movement.getPosition();
    var srcXTile = Math.round((pos[0]-mapTileWidth/2)/mapTileWidth);
    var srcYTile = Math.round((pos[1]-mapTileHeight/2)/mapTileHeight);

    // grid.setWalkableAt(srcXTile, srcYTile, true);

    var res = pf.findPath(srcXTile, srcYTile, tarXTile, tarYTile, grid);

    res.shift();
    this.movement.entity.path = res;
    var resArr = [];
    for (var i = 0; i < res.length; i++) {
      var node = res[i];
      if(i == res.length-1){
        var nodeX = (node[0]*mapTileWidth)+data[2];
        var nodeY = (node[1]*mapTileHeight)+data[3];
      }else{  
        var nodeX = (node[0]*mapTileWidth)+mapTileWidth/2;
        var nodeY = (node[1]*mapTileHeight)+mapTileHeight/2;
      }
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