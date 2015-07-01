/**
 * Action constants for event message actions
 * @type Object
 */
exports.EVENT_ACTION = Object.freeze({
  ENTITY_STATE_UPDATE: 0,
  PRODUCE: 1,
  RESOURCE_CHANGE: 2,
  PLAYER_CONNECTED: 3,
  PLAYER_DISCONNECTED: 6,
  AI_PLAYER_ADDED: 5,
  PING: 4
});

exports.EVENT_INPUT = Object.freeze({
  INPUT_BUFFER: 9,
  MOUSE_CLICK: 10,
  KEYBOARD_KEYPRESS: 11,
  MOUSE_DRAG_BEGIN: 12,
  MOUSE_DRAG_END: 13,
  UNIT_SPAWN: 14
});

exports.EVENT_OUTGOING = Object.freeze({
  FLUSH_PLAYER_MESSAGES: 20
});

exports.EVENT_PLAYER_COMMAND = Object.freeze({
  UNIT_MOVE: 30,
  UNIT_ATTACK: 31,
  UNIT_ABILITY: 32
});


exports.EVENT_ENTITY_ACTION = Object.freeze({
  SPAWN: 40,
  MOVE: 41
});