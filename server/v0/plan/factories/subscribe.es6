/*Parent class cloning*/

	var MysqlFactory = require('kanto-patterns-mysql').mysqlFactory.clone();

/*Attributes definitions*/

	MysqlFactory._name = 'Subscribe';
	MysqlFactory._table = 'subscribe';

/*Model definition*/

	MysqlFactory.model.userid = -1;
	MysqlFactory.model.planid = -1;
	MysqlFactory.model.datestart = new Date();
	MysqlFactory.model.dateend = new Date();
	MysqlFactory.model.paused = 0;
	MysqlFactory.model.remainingtime = 0;
	MysqlFactory.model.renew = 0;

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MysqlFactory.get.methodName = method;

module.exports = MysqlFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function method(/*arguments*/) {
		/*content*/
	}