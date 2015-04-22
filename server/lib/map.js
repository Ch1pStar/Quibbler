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
  var xIndex = 0, yIndex = 0;
  var boundsData = [];

  for (var i = 0; i < data.length; i++) {
    
    var tile = data[i];
    if(tile!=0){
      boundsData.push([xIndex, yIndex]);
    }
    
    if(xIndex==(this.width-1)){
      yIndex++;
      xIndex = 0;
    }else{
      xIndex++;
    }
  };
  return boundsData;
};

module.exports = Map;