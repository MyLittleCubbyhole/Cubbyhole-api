var Driver = require('mysql'),
	pool = null;

/*Class declarations*/

	class Driver {}

/*Static methods declarations*/

	Driver.init = init;
	Driver.get = get;

module.exports = Driver;

/*Static methods definitions*/

	function init() {
		if(!pool)
			pool  = Driver.createPool(global.configs.databases.mysql.auth);

		return this;
	}

	function get() {
		return pool;
	}