var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `plan`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `plan` where `id` = '+ parseInt(id, 10) +';', callback);
}

/********************************[  CREATE   ]********************************/


provider.create.plan = function(plan, callback) {
	var query = 'insert into `plan` (`price`,`name`,`storage`,`duration`,`uploadbandwidth`,`downloadbandwidth`,`quota`) values (';
	query += plan.price + ',"' + plan.name + '",' + parseInt(plan.storage, 10) + ',' + parseInt(plan.duration, 10) + ',' + parseInt(plan.uploadBandWidth, 10) + ',' + parseInt(plan.downloadBandWidth,10) + ', ' + parseInt(plan.quota, 10) + ')';

	Mysql.query(query, callback);

}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `plan` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

provider.update.all = function(plan, callback) {
	Mysql.query('update `plan` set `price`=' + plan.price + ', `name`="' + plan.name + '", `storage`=' + parseInt(plan.storage, 10) + ', `duration`=' + parseInt(plan.duration, 10) + ', `uploadbandwidth`=' + parseInt(plan.uploadBandWidth, 10) + ', `downloadbandwidth`=' + parseInt(plan.downloadBandWidth,10) + ', `quota`=' + parseInt(plan.quota, 10) + ' where `id`=' + parseInt(plan.id, 10) + ';', callback);
}



module.exports = provider;