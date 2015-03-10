/**
 * Base entity class
 */
define([], function(){

  var Entity = Class.extend({
    init: function(pGame, config){
      this.pGame = pGame;
      this.type = config.type;
      this.id = config.id;
      this.owner = config.owner;
      this.manager = config.manager;
      var centerX = config.x - 32/2;
      var centerY = config.y - 32/2;

      this.visionRadius =  config.visionRadius;

      var grphx = this.pGame.add.graphics(config.x, config.y);  //init rect
      grphx.lineStyle(1, this.owner.team.color, 1); // width, color (0x0000FF), alpha (0 -> 1) // required settings
      grphx.beginFill(this.owner.team.color*.4, .2) // color (0xFFFF0B), alpha (0 -> 1) // required settings
      grphx.drawRect(0, 0, 32, 32); // x, y, width, height


      // this.t = grphx;
      this.obj = grphx;
      // this.obj = this.pGame.add.sprite(centerX, centerY, 'simple_tile');

      this.obj.rotation = config.r;
      this.obj.pivot.x = this.obj.width/2;
      this.obj.pivot.y = this.obj.height/2;
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


      // var visionAura = this.pGame.add.graphics(0, 0);  //init rect
      // visionAura.lineStyle(1, this.owner.team.color, 1); // width, color (0x0000FF), alpha (0 -> 1) // required settings
      // visionAura.beginFill(this.owner.team.color*.4, 0) // color (0xFFFF0B), alpha (0 -> 1) // required settings
      // visionAura.drawCircle(this.obj.width/2, this.obj.height/2, this.visionRadius*32); // x, y, width, height
      // // visionAura.pivot.x = visionAura.width/2;
      // // visionAura.pivot.y = visionAura.height/2;
      // this.obj.addChild(visionAura);

      // this.pGame.physics.p2.enable(this.obj);

    },

    update: function(){
      
      // if(!this.obj.visible){
      //   return;
      // }

      if(!this.frames.length) {
        return;
      }
      this.resolvePosition();
      this.updateCalls++;
    },

    draw: function(){
      this.renderCalls++;

    },

    show: function(){
      this.obj.visible = true;  
    },

    hide: function(){
      this.obj.visible = false;
    },

    resolvePosition: function(){

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
          y: targetFrame.y,
          r: targetFrame.r
        };

        var prevPos = {
          x: previousFrame.x,
          y: previousFrame.y,
          r: previousFrame.r
        };

        // this.obj.body.x = this.lerp(targetPos.x, prevPos.x, timePoint);
        // this.obj.body.y = this.lerp(targetPos.y, prevPos.y, timePoint);

        this.obj.x = this.lerp(targetPos.x, prevPos.x, timePoint);
        this.obj.y = this.lerp(targetPos.y, prevPos.y, timePoint);
        this.obj.rotation = this.lerp(targetPos.r, prevPos.r, timePoint);

        this.resolveVision(targetFrame);

      }

    },

    resolveVision: function(frame){
      // console.log(frame.seenBy.length, this.manager.playingPlayer.team.id);
      for (var i = 0; i < frame.seenBy.length; i++) {
        if(frame.seenBy[i] == this.manager.playingPlayer.team.id){
          var column = Math.round(this.obj.x/32);
          var row = Math.round(this.obj.y/32);
          try{
            this.fillFogMaskCircle(column, row, this.visionRadius);
          }catch(e){
            // console.log(e);
          }
          this.show();
          break;
        }else{
          this.hide();
        }
      };
    },

    fillFogMaskCircle: function(x0, y0, radius){
      var x = radius;
      var y = 0;
      var radiusError = 1-x;
       
      while(x >= y){
        // this.manager.fogMask[x + x0][y + y0] = 1;
        // this.manager.fogMask[-x + x0][y + y0] = 1;
        
        this.manager.fogMask[y + x0][x + y0] = 1;
        this.manager.fogMask[-y + x0][x + y0] = 1;
        
        var leftC = -x + x0;
        var leftR = -y + y0;
        var rightC = x + x0;
        var rightR = -y + y0;
        // this.manager.fogMask[leftC][leftR] = 1;
        // this.manager.fogMask[rightC][rightR] = 1;
        this.fillFogMaskLine(leftC, rightC, leftR, rightR);
        
        this.manager.fogMask[-y + x0][-x + y0] = 1;
        this.manager.fogMask[y + x0][-x + y0] = 1;
        
        this.fillFogMaskLine(x0-x, x0+x, y0+y, y0+y);
        
        y++;
        if (radiusError<0)
        {
          radiusError += 2 * y + 1;
        }
        else
        {
          x--;
          radiusError += 2 * (y - x) + 1;
        }
      }
    },

    fillFogMaskLine: function(x0, x1, y0, y1){
      var deltax = x1 - x0;
      var deltay = y1 - y0;
      var error = 0;
      var deltaerr = Math.abs(deltay / deltax); 
      var y = y0;
      for(var x = x0; x <= x1; x++){
        this.manager.fogMask[x][y] = 1;
        error = error + deltaerr;
        while(error >= 0.5){
          this.manager.fogMask[x][y] = 1;
          y = y + (y1 - y0)?(y1 - y0)<0?-1:1:0;
          error = error - 1.0;
        }
      }
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