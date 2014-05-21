var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `payment`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `payment` where `id` = '+ parseInt(id, 10) +';', callback);
}

/********************************[  CREATE   ]********************************/


provider.create.payment = function(payment, callback) {
	var query = 'insert into `payment` (`id`,`amount`,`currency`,`duration`, `date`, `email`, `userid`, `subscribeid`) values (';
	query += parseInt(payment.id, 10) + ',' + parseFloat(payment.amount, 10) + ',"' + payment.currency + '",' + parseInt(payment.duration, 10) + ',"' + payment.date + '","' + payment.email + '",' + parseInt(payment.userId, 10) + ', ' + parseInt(payment.subscribeId, 10) + ')';
	Mysql.query(query, callback);

}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `payment` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/



module.exports = provider;