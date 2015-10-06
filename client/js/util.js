/**
 * This is a config file, defining constant values
 */
define({
  EVENT_ACTION: Object.freeze({
    ENTITY_STATE_UPDATE: 0,
    PRODUCE: 1,
    RESOURCE_CHANGE: 2,
    WELCOME: 7,
    PLAYER_CONNECTED:3,
    PING: 4
  }),

  EVENT_INPUT: Object.freeze({
    INPUT_BUFFER: 9,
    MOUSE_CLICK: 10,
    KEYBOARD_KEYPRESS: 11,
    MOUSE_DRAG_BEGIN: 12,
    MOUSE_DRAG_END: 13
  }),

  EVENT_PLAYER_COMMAND: Object.freeze({
    UNIT_TARGET_ABILITY: 30,
    UNIT_GROUND_ABILITY: 31,
    GLOBAL_ABILITY: 32,
    SELECTION: 33
  }),


  GAME_CLIENT_TYPE: Object.freeze({
  	NETWORK: 0,
  	SINGLE_PLAYER: 1,
  	REPLAY: 2,
  }),

  EVENT_ENTITY_ACTION: Object.freeze({
    SPAWN: 40,
    MOVE: 41,
    REMOVE: 42
  })
});