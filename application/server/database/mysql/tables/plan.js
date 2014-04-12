var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `plan`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `plan` where `ID` = '+ parseInt(id, 10) +';', callback);
}

/********************************[  CREATE   ]********************************/


provider.create.plan = function(plan, callback) {

	var query = 'insert into `plan` (`PRICE`,`NAME`,`STORAGE`,`DURATION`,`UPLOADBANDWIDTH`,`DOWNLOADBANDWIDTH`,`QUOTA`) values (';
	query += plan.price + ',"' + data.name + '",' + parseInt(data.storage, 10) + ',' + parseInt(plan.duration, 10) + ',' + parseInt(plan.uploadBandWidth, 10) + ',' + parseInt(plan.downloadBandWidth,10) + ', ' + parseInt(plan.quota, 10) + ')';
	Mysql.query(query, callback);

}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `plan` where `ID`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

provider.update.price = function(plan, callback) {
	Mysql.query('update `plan` set `PRICE`=' + data.price + ' where `ID`=' + parseInt(plan.id, 10) + ';', callback);
}

provider.update.storage = function(plan, callback) {
	Mysql.query('update `plan` set `STORAGE`=' + parseInt(plan.storage, 10) + ' where `ID`=' + parseInt(plan.id, 10) + ';', callback);
}

provider.update.duration = function(plan, callback) {
	Mysql.query('update `plan` set `DURATION`=' + parseInt(plan.duration, 10) + ' where `ID`=' + parseInt(plan.id, 10) + ';', callback);
}

provider.update.uploadBandWidth = function(plan, callback) {
	Mysql.query('update `plan` set `UPLOADBANDWIDTH`=' + parseInt(plan.uploadBandWidth, 10) + ' where `ID`=' + parseInt(plan.id, 10) + ';', callback);
}

provider.update.downloadBandWidth = function(plan, callback) {
	Mysql.query('update `plan` set `DOWNLOADBANDWIDTH`=' + parseInt(plan.downloadBandWidth,10) + ' where `ID`=' + parseInt(plan.id, 10) + ';', callback);
}



module.exports = provider;