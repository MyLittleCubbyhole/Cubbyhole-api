var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

/**
 * Get all role objects
 * @param  {Function} callback
 */
provider.get.all = function(callback) {
	Mysql.query('select * from `role`;', callback);
}

/**
 * Get a role object by it's id
 * @param  {integer}   id       id of the object to find
 * @param  {Function} callback
 */
provider.get.byId = function(id, callback) {
	Mysql.query('select * from `role` where `id` = '+ parseInt(id, 10) +';', callback);
}

/**
 * Get a role object by it's title
 * @param  {integer}   title       title of the object to find
 * @param  {Function} callback
 */
provider.get.byTitle = function(title, callback) {
	Mysql.query('select * from `role` where `title`="'+ title + '";', callback);
}
/********************************[  CREATE   ]********************************/

/**
 * Create a role object
 * @param  {object}   role role to create
 * @param  {Function} callback
 */
provider.create.role = function(title, callback) {
	Mysql.query('insert into `role` (`title`) values ("' + title + '")', callback);
}

/********************************[  DELETE   ]********************************/

/**
 * Delete a role object
 * @param  {integer}   id       id of the object to delete
 * @param  {Function} callback
 */
provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `role` where `id`='+ parseInt(id, 10) + ';', callback);
}

module.exports = provider;