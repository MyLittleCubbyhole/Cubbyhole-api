/*Bin requiring*/

	var ConfigAggregator = require(__dirname + '/bin/utils/configAggregator');

/*Class declaration*/

	class ConfigLoader {}

/*Static methods declarations*/

	ConfigLoader.init = init;

module.exports = ConfigLoader;

/*Static methods definitions*/

	function init() {
		ConfigAggregator.aggregate('config', 'config');
		ConfigAggregator.aggregate('parameters', 'parameters');
	}