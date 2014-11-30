var Driver = require('mysql'),
	pool = null;

/*Class declarations*/

	class MysqlDriver {}

/*Static methods declarations*/

	MysqlDriver.init = init;
	MysqlDriver.get = get;

module.exports = MysqlDriver;

/*Static methods definitions*/

	function init() {
		if(!pool)
			pool  = Driver.createPool({
				'host': global.config.databases.mysql.host,
				'port': global.config.databases.mysql.port,
				'database': global.config.databases.mysql.schema.name,
				'user': global.config.databases.mysql.schema.user,
				'password': global.config.databases.mysql.schema.password
			});

		return this;
	}

	function get() {
		return pool;
	}