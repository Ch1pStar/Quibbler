var Vec2 = require('../../../../lib/vectormath.js');

function Formation (anchor, pattern, slotAssignmentStrategy,
                                                motionModerator){

  if (typeof anchor == 'undefined'){
    throw new Error("The anchor point cannot be null"); 
  }

  if(typeof motionModerator == 'undefined'){
    motionModerator = null;
  }
  
  this.anchor = anchor;
  this.pattern = pattern;
  this.slotAssignmentStrategy = slotAssignmentStrategy;
  this.motionModerator = motionModerator;

  this.driftOffset = [[0,0],0];
  this.positionOffset = anchor[0].slice();

  this.slotAssignments = [];
}

Formation.prototype.updateSlotAssignments = function() {
  this.slotAssignmentStrategy.updateSlotAssignments(slotAssignments);
  pattern.numberOfSlots = this.slotAssignmentStrategy.calculateNumberOfSlots(this.slotAssignments);

  if(this.motionModerator != null){
    this.motionModerator.calculateDriftOffset(this.driftOffset, this.slotAssignments, this.pattern);
  }
};

Formation.prototype.changePattern = function(pattern) {
  var occupiedSlots = this.slotAssignments.length;

  if(pattern.supportsSlots(occupiedSlots)){
    this.pattern = pattern;

    this.updateSlotAssignments();

    return true;
  }

  return false;
};

Formation.prototype.addMember = function(member) {
  var occupiedSlots = slotAssignments.length;

  if(this.pattern.supportsSlots(occupiedSlots+1)){
    this.slotAssignments.push([member, occupiedSlots]);


    this.updateSlotAssignments();
    return true;
  }

  return false;
};

Formation.prototype.removeMember = function(member) {
  var slot = this.findMember(member);
  if(slot >= 0){
    this.slotAssignmentStrategy.removeSlotAssignment(this.slotAssignments, slot);
  }

  this.updateSlotAssignments();
};

Formation.prototype.findMember = function(member) {
  for (var i = 0; i < this.slotAssignments.length; i++) {
    if(this.slotAssignments[i][0] == member){
      return i;
    }
  };
  return -1;
};


Formation.prototype.updateSlots = function() {
  var anchor = this.anchor.slice();
  this.positionOffset = anchor;
  var orientationOffset = 


};



module.exports = Formation;