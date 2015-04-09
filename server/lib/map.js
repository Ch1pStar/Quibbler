var fs = require('fs');

function Map(url){

  this.url = url;
  var self = this;

  this.loadMapData();

}

Map.prototype.loadMapData = function() {
  var dataStr = fs.readFileSync(this.url);

  var data = JSON.parse(dataStr);
  this.height = data.height;
  this.width = data.width;
  this.tileHeight = data.tileheight;
  this.tileWidth = data.tilewidth;
  this.layers = data.layers;

};

Map.prototype.getBoundsData = function() {
  var collisionIndex = this.layers.length-1;
  var collisionLayer = this.layers[collisionIndex];
  var data = collisionLayer.data;
  var xIndex = this.tileWidth/2;
  var yIndex = this.tileHeight/2;
  var boundsData = [];
  for (var i = 0; i < data.length; i++) {
    var tile = data[i];
    if(tile!=0){
      // console.log("Found a tile at: %s(%s) %s(%s)", xIndex,xIndex/this.tileWidth, yIndex, yIndex/this.tileHeight);
      boundsData.push([xIndex, yIndex]);
    }
    if(i>0 && i%this.width==0){
      yIndex += this.tileHeight;
      xIndex = this.tileWidth+this.tileWidth/2;
    }else{
      xIndex += this.tileWidth;
    }
  
  };
  return boundsData;

};

module.exports = Map;