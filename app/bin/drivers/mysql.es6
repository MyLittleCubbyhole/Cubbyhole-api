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
				'host': global.configs.databases.mysql.host,
				'port': global.configs.databases.mysql.port,
				'database': global.configs.databases.mysql.schema.name,
				'user': global.configs.databases.mysql.schema.user,
				'password': global.configs.databases.mysql.schema.password
			});

		return this;
	}

	function get() {
		return pool;
	}