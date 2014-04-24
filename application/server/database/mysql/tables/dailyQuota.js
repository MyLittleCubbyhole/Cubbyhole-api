var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `daily_quota`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `daily_quota` where `id` = '+ parseInt(id, 10) +';', callback);
}

provider.get.bySubscribeId = function(subscribeId, callback) {
	Mysql.query('select * from `daily_quota` where `subscribeid` = '+ parseInt(subscribeId, 10) +';', callback);
}

/********************************[  CREATE   ]********************************/


provider.create.dailyQuota = function(dailyQuota, callback) {
	var query = 'insert into `daily_quota` (`day`,`quotaused`,`subscribeid`) values (';
	query += dailyQuota.day + ',"' + parseInt(dailyQuota.quotaUsed, 10) + '",' + parseInt(dailyQuota.subscribeId, 10) + ')';
	Mysql.query(query, callback);
}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `daily_quota` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

provider.update.quotaUsed = function(dailyQuota, callback) {
	Mysql.query('update `daily_quota` set `quotaused`=' + parseInt(dailyQuota.quotaUsed, 10) + ' where `id`=' + parseInt(daily_quota.id, 10) + ';', callback);
}


module.exports = provider;