/**
 * Base entity class
 */
define([], function(){

  var Entity = Class.extend({
    init: function(pGame, x, y, id, type){
      this.pGame = pGame;
      var centerX = x - 32/2;
      var centerY = y - 32/2;
      this.obj = this.pGame.add.sprite(centerX, centerY, 'simple_tile');
      this.updateCalls = 0;
      this.renderCalls = 0;
      this.lastUpdateWindowStarted = 0;
      this.lastUpdateWindowStartedDraw = 0;
      this.frames = [
        {
          x: this.obj.x,
          y: this.obj.y,
          t: this.pGame.time.now
        }
      ];
      this.type = type;
      this.id = id;

    },

    update: function(){

      if(!this.frames.length) {
        return;
      }

      var currentTime = this.pGame.time.now;
      // console.log(this.pGame.time.now);
      var count = this.frames.length-1;
      var targetFrame = null;
      var previousFrame = null;

      for(var i = 0; i < count; ++i) {
          var point = this.frames[i];
          var nextPoint = this.frames[i+1];
          if(currentTime > point.t && currentTime < nextPoint.t) {
              targetFrame = nextPoint;
              previousFrame = point;
              break;
          }
      }

      if(!targetFrame) {
        targetFrame = this.frames[this.frames.length - 1];
        previousFrame = this.frames[this.frames.length - 1];
      }

      if(targetFrame && previousFrame) {

        this.targetTime = targetFrame.t;

        var difference = this.targetTime - currentTime;
        var maxDifference = (targetFrame.t - previousFrame.t);
        var timePoint = (difference/maxDifference);

        if( isNaN(timePoint) ) {
          timePoint = 0;
        }
        if(timePoint == -Infinity) {
          timePoint = 0;
        }
        if(timePoint == Infinity) {
          timePoint = 0;
        }

        var targetPos = {
          x: targetFrame.x,
          y: targetFrame.y
        };

        var prevPos = {
          x: previousFrame.x,
          y: previousFrame.y
        };

        this.obj.x = this.lerp(targetPos.x, prevPos.x, timePoint);
        this.obj.y = this.lerp(targetPos.y, prevPos.y, timePoint);


      }

      this.updateCalls++;
    },

    draw: function(){

      this.renderCalls++;



    },

    lerp: function(p, n, t) { 
      var _t = Number(t);
      _t = (Math.max(0, Math.min(1, _t)));
      return (p + _t * (n - p)); 
      
      // Bezier curve(something is wrong)
      // var b = (Math.random()*Math.abs(p-n)) + n;
      // return (Math.pow((1 - _t), 2)*n) + ((2*_t)*(1-_t))*b + Math.pow(_t,2)*p;  
    },
    
    //Simple linear interpolation between 2 vectors
    v_lerp: function(v,tv,t) { 
      return { 
        x: this.lerp(v.x, tv.x, t), 
        y:this.lerp(v.y, tv.y, t) 
      }; 
    }

  });

  return Entity;
});