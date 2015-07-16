/**
 * 
 */
function FreeSlotAssignmentStrategy () {


}

FreeSlotAssignmentStrategy.prototype.updateSlotAssignments = function(assignments) {
  for (var i = 0; i < assignments.length; i++){
    assignments[i].slotNumber = i;
  }
};

FreeSlotAssignmentStrategy.prototype.calculateNumberOfSlots = function(assignments) {
  return assignments.length;
};

module.exports = FreeSlotAssignmentStrategy;