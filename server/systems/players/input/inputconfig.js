var consts = require('../../../lib/const.js');
var config = {};

//cursor xy, ability index, should we use queue
config[consts.EVENT_PLAYER_COMMAND.UNIT_GROUND_ABILITY] = 4;

//target, ability index, should we use queue
config[consts.EVENT_PLAYER_COMMAND.UNIT_TARGET_ABILITY] = 3;

//ability index
config[consts.EVENT_PLAYER_COMMAND.GLOBAL_ABILITY] = 3;

config[consts.EVENT_PLAYER_COMMAND.SELECTION] = Infinity;


module.exports = Object.freeze(config);