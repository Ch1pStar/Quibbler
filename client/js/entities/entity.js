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
      this.tileWidth = this.manager.tileMap.pMap.tileWidth;
      this.tileHeight = this.manager.tileMap.pMap.tileHeight;
      var centerX = config.x;// - this.tileWidth/2;
      var centerY = config.y;// - this.tileHeight/2;

      this.visionRadius =  config.visionRadius;

      this.selected = false;

      var grphx = this.pGame.add.graphics(0, 0);  //init rect
      grphx.lineStyle(1, this.owner.team.color, 1); // width, color // required settings
      grphx.beginFill(this.owner.team.color, .2) // color  // required settings
      // grphx.drawRect(0, 0, this.tileWidth, this.tileHeight); // x, y, width, height
      grphx.drawCircle(this.tileWidth/2, this.tileHeight/2, this.tileHeight); // x, y, width, height

      grphx.drawCircle(this.tileWidth/2, this.tileHeight/2, 1);
      // grphx.drawCircle(this.tileWidth/2, this.tileHeight/2, 20);
      

      var sprite = this.pGame.add.sprite(centerX, centerY);
      sprite.addChild(grphx); 

      sprite.inputEnabled = true;

      sprite.events.onInputDown.add(this.onClick,this);

      this.obj = sprite;
      // this.obj = grphx;


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
          t: this.pGame.time.now,
          seenBy: [],
          path: []
        }
      ];

      this.pathGraphics = this.pGame.add.group();


      // var visionAura = this.pGame.add.graphics(0, 0);  //init rect
      // visionAura.lineStyle(1, this.owner.team.color, 1); // width, color (0x0000FF), alpha (0 -> 1) // required settings
      // visionAura.beginFill(this.owner.team.color*.4, 0) // color (0xFFFF0B), alpha (0 -> 1) // required settings
      // visionAura.drawCircle(this.obj.width/2, this.obj.height/2, (this.visionRadius*32)*2); // x, y, width, height
      // // visionAura.pivot.x = visionAura.width/2;
      // // visionAura.pivot.y = visionAura.height/2;
      // this.obj.addChild(visionAura);

      // this.pGame.physics.p2.enable(this.obj);

    },

    onClick: function(e,p){
      console.log("Clicked on entity - %d",this.id);
      if(this.selected){
        this.setSelected(false);
      }else{
        this.setSelected(true);
      }
    },

    setSelected: function(val){
      this.selected = val;
      this.manager.game.updateSelection();
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

    remove: function(){
      this.setSelected(false);
      this.obj.destroy();

      //maybe free entity resources aswell? who cares maybe later
    },

    resolvePosition: function(){

      var currentTime = this.pGame.time.now;
      var tickTime = this.manager.game.tickCount;

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
        console.log("no frame or dropped packet");
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

        this.obj.x = this.lerp(targetPos.x, prevPos.x, timePoint);
        this.obj.y = this.lerp(targetPos.y, prevPos.y, timePoint);
        this.obj.rotation = this.lerp(targetPos.r, prevPos.r, timePoint);

        this.resolveVision(targetFrame);
        // this.drawPath(targetFrame.path);
      }

    },

    drawPath: function(path){
      this.pathGraphics.removeAll();
      for (var i = 0; i < path.length; i++) {
        var pathNode = path[i];

        var nodeX = (pathNode[0]*32);
        var nodeY = (pathNode[1]*32);

        var grphx = this.pGame.add.graphics(nodeX, nodeY);  //init rect
        grphx.lineStyle(1, 0x777777, 1); // width, color // required settings
        grphx.beginFill(0xCCCCCC, .2) // color  // required settings
        grphx.drawRect(0, 0, this.tileWidth, this.tileHeight); // x, y, width, height

        this.pathGraphics.add(grphx);
      };
    },

    resolveVision: function(frame){
      // console.log(frame.seenBy.length, this.manager.playingPlayer.team.id);
      for (var i = 0; i < frame.seenBy.length; i++) {
        if(frame.seenBy[i] == this.manager.playingPlayer.team.id){
          var column = Math.round( (this.obj.x-this.tileWidth/2) /this.tileWidth);
          var row    = Math.round( (this.obj.y) /this.tileHeight);
          try{
            this.fillFogMaskCircle(column, row, this.visionRadius);
          }catch(e){
            console.log(e);
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

        // this.manager.fogMask[y + x0][x + y0] = 1;
        // this.manager.fogMask[-y + x0][x + y0] = 1;


        var leftC = -x + x0;
        var leftR = -y + y0;
        var rightC = x + x0;
        var rightR = -y + y0;
        // this.manager.fogMask[leftC][leftR] = 1;
        // this.manager.fogMask[rightC][rightR] = 1;

        this.fillFogMaskLine(-y + x0, y + x0, -x + y0, -x + y0);

        this.fillFogMaskLine(leftC, rightC, leftR, rightR);
        this.fillFogMaskLine(x0-x, x0+x, y0+y, y0+y);

        this.fillFogMaskLine(-y + x0, y + x0, x + y0, x + y0);

        // this.manager.fogMask[-y + x0][-x + y0] = 1;
        // this.manager.fogMask[y + x0][-x + y0] = 1;





        y++;
        if (radiusError<0){
          radiusError += 2 * y + 1;
        }
        else{
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
        if(x>-1 && y>-1 && x<this.manager.fogMask.length-1){
          this.manager.fogMask[x][y] = 1;
        }
        error = error + deltaerr;
        while(error >= 0.5){
          if(x>-1 && y>-1 && x<this.manager.fogMask.length-1){
            this.manager.fogMask[x][y] = 1;
          }
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
