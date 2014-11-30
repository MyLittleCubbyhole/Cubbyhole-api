/*Parent class cloning*/

	var MysqlFactory = require('kanto-patterns-mysql').mysqlFactory.clone();

/*Service requiring*/

	var moment = require('moment');

/*Attributes definitions*/

	MysqlFactory._name = 'Subscribe';
	MysqlFactory._table = 'subscribe';

/*Model definition*/

	MysqlFactory.model.userid = -1;
	MysqlFactory.model.planid = -1;
	MysqlFactory.model.datestart = moment().format('YYY-MM-DD');
	MysqlFactory.model.dateend = moment().format('YYY-MM-DD');
	MysqlFactory.model.paused = 0;
	MysqlFactory.model.remainingtime = 0;
	MysqlFactory.model.renew = 0;

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MysqlFactory.create = create;

module.exports = MysqlFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function create(model) {
		var query = 'INSERT INTO `subscribe` (`userid`,`planid`,`datestart`,`dateend`, `paused`, `remainingtime`, `renew`)\
			VALUES (' + parseInt(model.userId, 10) + ',\
					' + parseInt(model.planId, 10) + ',\
					"' + model.dateStart + '",\
					"' + model.dateEnd + '",\
					0,\
					0,\
					' + (model.renew ? 1 : 0) + ');';

		return this.query(query);
	}