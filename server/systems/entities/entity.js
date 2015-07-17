var Body = require('p2').Body;
var Rectangle = require('p2').Rectangle;
var Circle = require('p2').Circle;


//Components
var GroundMovement = require('./components/groundmovement');
var MeleeAttack = require('./abilities/meleeattack');
var TrainUnit = require('./abilities/trainunit');

function Entity(config){

  var body = new Body({
    position: [config.x, config.y],
    mass: config.mass
    // angle: config.r
  });

  var shape = new Circle(config.width/2);

  body.addShape(shape);

  this.body = body;

  this.id = config.id
  // this.id = this.body.id;

  this.manager = config.manager;
  // this.x = config.x;
  // this.y = config.y;
  // this.r = config.r;


  this.owner = config.owner;
  this.visionRadius = config.visionRadius;
  this.seenBy = [];
  this.controlledBy = [this.owner.id];

  //attack is always first ability
  this.abilities = [];
  this.abilityQueue = [];
  
  this.type = config.type;  

  this.blocking = true;

  this.stateChanged = false;

  this.movement = new GroundMovement(this, 'fp');


}

Entity.prototype.addAbility = function(name) {
  if(name=="train-unit"){
    this.abilities.push(new TrainUnit(this));
  }
  if(name=="melee-attack"){
    this.abilities.push(new MeleeAttack(this));
  }
};

Entity.prototype.getAbilities = function() {
  var res = [];
  for (var i = 0; i < this.abilities.length; i++) {
    res[i] = this.abilities[i].name;
  };
  return res;
};

Entity.prototype.addMoveCommand = function (data) {
  console.log("\t*** Adding move command to entity %d ***", this.id);
  this.movement.useQueue = data[2];
  this.movement.moveOrders.push(data);
};

Entity.prototype.addAbilityCommand = function (data) {
  this.abilityQueue[0] = data;
};


Entity.prototype.update = function (time) {
  // if(this.body.previousPosition[0] != this.body.position[0] || this.body.previousPosition[1] != this.body.position[1]){
    this.stateChanged = true;
  // }

  //movement
  this.movement.process(time);
  
  //abilities
  var abilityData;
  while(typeof(abilityData=this.abilityQueue.shift())!='undefined'){
    try{
      var ability = this.abilities[abilityData[2]];
      ability.run(abilityData);
    }catch(e){
      console.log("Invalid ability used - %d", abilityData[2]);
    }
  }
  

  //vision
  this.resolveSeenBy();
};

Entity.prototype.resolveSeenBy = function() {
  this.seenBy = [];
  for(var p in this.manager.core.ps.players){
    //tmp
    if(!this.manager.core.ps.players[p].isAI){
      this.seenBy.push(this.manager.core.ps.players[p].id);
    }
  }
};

Entity.prototype.getNetworkAttributes = function () {
  var res = [
    this.body.position[0],
    this.body.position[1],
    this.body.angle,
    this.id,
    this.visionRadius,
    this.owner.id
  ];

  if(this.seenBy.length>0){
    res.push(this.seenBy.length);
  }
  for (var j = 0; j < this.seenBy.length; j++) {
    res.push(this.seenBy[j]);
  };

  var path = this.movement.getTilePath();
  if(path.length>0){
    res.push(1);

    var lastPathIndex = path.length-1;
    for (var i = 0; i < path[lastPathIndex].length; i++) {
      res.push(path[lastPathIndex][i]);
    }
  }
  res.unshift(res.length);
  return res;
};

Entity.prototype.getInitialNetworkAttributes = function () {
  var res = [
    this.body.position[0],
    this.body.position[1],
    this.body.angle,
    this.id,
    this.visionRadius,
    this.owner.id
  ];
  res.unshift(res.length);
  return res;
};


module.exports = Entity;
