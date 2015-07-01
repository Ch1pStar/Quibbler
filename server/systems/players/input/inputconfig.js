var consts = require('../../../lib/const.js');
var config = {};

config[consts.EVENT_PLAYER_COMMAND.UNIT_MOVE] = 2;
config[consts.EVENT_PLAYER_COMMAND.UNIT_ATTACK] = 2;
config[consts.EVENT_PLAYER_COMMAND.UNIT_ABILITY] = 3;


module.exports = Object.freeze(config);