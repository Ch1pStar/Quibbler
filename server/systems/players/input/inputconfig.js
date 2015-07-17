var consts = require('../../../lib/const.js');
var config = {};

//cursor xy
config[consts.EVENT_PLAYER_COMMAND.UNIT_MOVE] = 3;

// /cursor xy
config[consts.EVENT_PLAYER_COMMAND.UNIT_ATTACK] = 2;

//cursor xy and ability index
config[consts.EVENT_PLAYER_COMMAND.UNIT_ABILITY] = 3;

//ability index
config[consts.EVENT_PLAYER_COMMAND.GLOBAL_ABILITY] = 3;


module.exports = Object.freeze(config);