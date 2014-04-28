var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `subscribe`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `subscribe` where `id` = '+ parseInt(id, 10) +';', callback);
}

/********************************[  CREATE   ]********************************/


provider.create.subscribe = function(subscribe, callback) {
	var query = 'insert into `subscribe` (`userid`,`planid`,`datestart`,`dateend`) values (';
	query += parseInt(subscribe.userId, 10) + ',' + parseInt(subscribe.planId, 10) + ',"' + subscribe.dateStart + '","' + subscribe.dateEnd + '")';
	Mysql.query(query, callback);

}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `subscribe` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/



module.exports = provider;