var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

/**
 * Get all plan objects
 * @param  {Function} callback
 */
provider.get.all = function(callback) {
	Mysql.query('select * from `plan` where `available`=1;', callback);
}

/**
 * Get a plan object by it's id
 * @param  {integer}   id       id of the object to find
 * @param  {Function} callback
 */
provider.get.byId = function(id, callback) {
	Mysql.query('select * from `plan` where `id` = '+ parseInt(id, 10) +';', callback);
}

/********************************[  CREATE   ]********************************/

/**
 * Create a plan object
 * @param  {object}   plan plan to create
 * @param  {Function} callback
 */
provider.create.plan = function(plan, callback) {
	var query = 'insert into `plan` (`photo`,`price`,`name`,`description`,`storage`,`duration`,`uploadbandwidth`,`downloadbandwidth`,`quota`,`available`) values ("';
	query += plan.photo + '",' + parseFloat(plan.price, 10) + ',"' + plan.name + '","' + plan.description + '",' + parseInt(plan.storage, 10) + ',' + parseInt(plan.duration, 10) + ',' + parseInt(plan.uploadBandWidth, 10) + ',' + parseInt(plan.downloadBandWidth,10) + ', ' + parseInt(plan.quota, 10) + ', 1)';

	Mysql.query(query, callback);

}

/********************************[  DELETE   ]********************************/

/**
 * Delete a plan object
 * @param  {integer}   id       id of the object to delete
 * @param  {Function} callback
 */
provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `plan` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

/**
 * Update the properties of a plan object except available
 * @param  {object}   plan     plan to update
 * @param  {Function} callback
 */
provider.update.all = function(plan, callback) {
	Mysql.query('update `plan` set `photo`="' + plan.photo + '", `price`=' + parseFloat(plan.price, 10) + ', `name`="' + plan.name + '", `description`="' + plan.description + '", `storage`=' + parseInt(plan.storage, 10) + ', `duration`=' + parseInt(plan.duration, 10) + ', `uploadbandwidth`=' + parseInt(plan.uploadBandWidth, 10) + ', `downloadbandwidth`=' + parseInt(plan.downloadBandWidth,10) + ', `quota`=' + parseInt(plan.quota, 10) + ' where `id`=' + parseInt(plan.id, 10) + ';', callback);
}

/**
 * Update the property available of a plan object
 * @param  {object}   plan     plan to update
 * @param  {Function} callback
 */
provider.update.available = function(plan, callback) {
    Mysql.query('update `plan` set `available`=' + (plan.available ? 1 : 0) + ' where `id`=' + parseInt(plan.id, 10) + ';', callback);
}



module.exports = provider;