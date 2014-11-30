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

	MysqlFactory.get.all = getAll;
	MysqlFactory.get.currentByUser = getCurrentByUser;
	MysqlFactory.get.paidSubscriptionsLastDays = getPaidSubscriptionsLastDays;
	MysqlFactory.create = create;

module.exports = MysqlFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getAll() {
		return this.query('select * from `subscribe`;');
	}

	function getCurrentByUser(userId) {
		var query = 'select * from `subscribe` where `userid` = '+ userId +' and `datestart` < NOW() and `dateend` > NOW();';
		return this.query(query);
	}

	function getPaidSubscriptionsLastDays(userId) {
		var query = 'SELECT count(*) AS COUNT\
			FROM `subscribe`\
			WHERE `userid` = ' + parseInt(userId, 10) + '\
			  AND `planid` <> 1\
			  AND\
				(SELECT DATEDIFF(NOW(), MAX(`dateend`))\
				 FROM `subscribe`\
				 WHERE `userid` = ' + parseInt(userId, 10) + '\
				   AND `planid` <> 1) <= 5;';

		return this.query(query);
	}

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