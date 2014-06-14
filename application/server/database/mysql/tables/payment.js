var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

/**
 * Get all payment objects
 * @param  {Function} callback
 */
provider.get.all = function(callback) {
	Mysql.query('select * from `payment`;', callback);
}

/**
 * Get a payment object by it's id
 * @param  {integer}   id       id of the object to find
 * @param  {Function} callback
 */
provider.get.byId = function(id, callback) {
	Mysql.query('select * from `payment` where `id` = '+ parseInt(id, 10) +';', callback);
}

/********************************[  CREATE   ]********************************/

/**
 * Create a payment object
 * @param  {object}   payment payment to create
 * @param  {Function} callback
 */
provider.create.payment = function(payment, callback) {
	var query = 'insert into `payment` (`id`,`amount`,`currency`,`duration`, `date`, `email`, `userid`, `subscribeid`) values (';
	query += parseInt(payment.id, 10) + ',' + parseFloat(payment.amount, 10) + ',"' + payment.currency + '",' + parseInt(payment.duration, 10) + ',"' + payment.date + '","' + payment.email + '",' + parseInt(payment.userId, 10) + ', ' + parseInt(payment.subscribeId, 10) + ')';
	Mysql.query(query, callback);

}

/********************************[  DELETE   ]********************************/

/**
 * Delete a payment object
 * @param  {integer}   id       id of the object to delete
 * @param  {Function} callback
 */
provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `payment` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/



module.exports = provider;