var Mysql = require(global.paths.server + '/database/mysql/core')
,	tools = require(global.paths.server + '/database/tools/mysql/core')
,	sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings')
,	historicProvider = require(global.paths.server + '/database/mongodb/collections/fs/historic')
,	provider = { get: {}, create: {}, delete: {}, update: {} };
tools.init();

/********************************[  GET   ]********************************/
/**
 * Get all users. Possibility to specify an offset and limit
 * @param  {[type]} options options needed to get users
 */
provider.get.all = function(options) {
	var temp = 0;
	options = options || {};
	options.offset = options.offset || 0;
	options.limit = options.limit || 100;


	if(options.limit < options.offset) {
		temp = options.limit;
		options.limit = options.offset;
		options.offset = temp;
	}
	options.callback = options.callback || function() {};
	Mysql.query('select * from `user` where id>1 LIMIT ' + options.offset + ',' + options.limit + ';', options.callback);
}

/**
 * Get an user object by it's id
 * @param  {integer}   id       id of the object to find
 * @param  {Function} callback
 */
provider.get.byId = function(id, callback) {
	Mysql.query('select * from `user` where `id` = '+ parseInt(id, 10) +';', callback);
}

/**
 * Get an user object by it's email. A like method is used, a partial email can be passed.
 * @param  {integer}   email       email of the object to find
 * @param  {Function} callback
 */
provider.get.byEmail = function(email, callback) {
	Mysql.query('select * from `user` where `email`="'+ email + '";', callback);
}

/**
 * Get an user object by it's email
 * @param  {integer}   email       email of the object to find
 * @param  {object}   options       optionnal, to specify offset and limit
 * @param  {Function} callback
 */
provider.get.byEmailLike = function(email, callback, options) {
	var temp = 0;
	options = options || {};
	options.offset = options.offset || 0;
	options.limit = options.limit || 100;


	if(options.limit < options.offset) {
		temp = options.limit;
		options.limit = options.offset;
		options.offset = temp;
	}
	Mysql.query('select * from `user` where `email` LIKE "%'+ email + '%" and id>1 LIMIT ' + options.offset + ',' + options.limit + ';', callback);
}

/**
 * Get an user object by it's email and role. A like method is used, a partial email can be passed. A limit and offset can also be specified.
 * @param  {string}   email    email of the object to find
 * @param  {role}   role     role of the object to find
 * @param  {Function} callback
 * @param  {object}   options  optionnal, to specify offset and limit
 */
provider.get.byEmailAndRole = function(email, role, callback, options) {
	var temp = 0;
	options = options || {};
	options.offset = options.offset || 0;
	options.limit = options.limit || 100;


	if(options.limit < options.offset) {
		temp = options.limit;
		options.limit = options.offset;
		options.offset = temp;
	}
	Mysql.query('select * from `user` where `email` LIKE "%'+ email + '%" and `roleid`='+ role +' and id>1 LIMIT ' + options.offset + ',' + options.limit + ';', callback);
}

/**
 * Get users by their role. A limit and offset can be specified.
 * @param  {integer}   role     role id used to get objects
 * @param  {Function} callback
 * @param  {object}   options  optionnal, to specify offset and limit
 */
provider.get.byRole = function(role, callback, options) {
	var temp = 0;
	options = options || {};
	options.offset = options.offset || 0;
	options.limit = options.limit || 100;


	if(options.limit < options.offset) {
		temp = options.limit;
		options.limit = options.offset;
		options.offset = temp;
	}
	Mysql.query('select * from `user` where `roleid`='+ role +' and id>1 LIMIT ' + options.offset + ',' + options.limit + ';', callback);
}

/**
 * Get name of users by their id
 * @param  {array}   ids      array of ids used to get users
 * @param  {Function} callback
 */
provider.get.namesByIds = function(ids, callback) {

	var query = 'select id, concat(firstname, " ", lastname) as creator from `user` where `id` IN ('+ ids.join(',') +');'

	Mysql.query(query, callback);
}

/**
 * Get bandwidth limits for an user
 * @param  {integer}   id       user id used to get limits
 * @param  {Function} callback
 */
provider.bandwidth = function(id, callback) {
	var query = "select u.id as id, p.downloadbandwidth as download, p.uploadbandwidth as upload from cubbyhole.plan p inner join cubbyhole.subscribe s on p.id = s.planid inner join cubbyhole.user u on u.id = s.userid where u.id = " + id + " and s.paused = 0 and NOW() between s.datestart and s.dateend;";

	Mysql.query(query, callback);
}

/**
 * Get some infos of users by their id
 * @param  {array}   ids      array of ids used to get users
 * @param  {Function} callback
 */
provider.get.emailsbyIds = function(ids, callback) {
	Mysql.query('select id, photo, email, firstname, lastname from `user` where `id`in('+ ids.join(',') +');', callback);
}

/**
 * Get all users of a shared folder
 * @param  {string}   fullPath fullPath used to get users
 * @param  {Function} callback
 */
provider.get.usersBySharing = function(fullPath, callback) {
	sharingProvider.get.byItemFullPath(fullPath, function(error, items) {
		if(!error && items && items.length>0) {
			var userIds = []
			,	users = {};
			for(var i = 0; i<items.length; i++) {
				users[items[i].sharedWith] = {right: items[i].right};
				userIds.push(items[i].sharedWith);
			}

			var usersTab = [];

			provider.get.emailsbyIds(userIds, function(error, dbUsers) {
				if(!error && dbUsers) {
					if(dbUsers.id) {
						users[dbUsers.id].email = dbUsers.email;
						users[dbUsers.id].photo = dbUsers.photo;
						users[dbUsers.id].firstname = dbUsers.firstname;
						users[dbUsers.id].lastname = dbUsers.lastname;
						usersTab.push(users[dbUsers.id]);
					}
					else if(dbUsers.length > 0)
						for(var i = 0; i<dbUsers.length; i++) {
							users[dbUsers[i].id].email = dbUsers[i].email;
							users[dbUsers[i].id].photo = dbUsers[i].photo;
							users[dbUsers[i].id].firstname = dbUsers[i].firstname;
							users[dbUsers[i].id].lastname = dbUsers[i].lastname;
							usersTab.push(users[dbUsers[i].id]);
						}
				}

				callback.call(this, '', usersTab);
			})
		}
		else
			callback.call(this, 'an error has occured'+error);
	})
}

/**
 * Get all historic elements for an users
 *
 * ex: provider.get.historic({
 * 		userId: xx,
 *   	offset: xx,
 *    	limit: xx
 * }, function() {...})
 *
 * @param  {object}   parameters params needed to get historic objects
 * @param  {Function} callback
 */
provider.get.historic = function(parameters, callback) {

	historicProvider.get.byUser(parameters, function(error, historic) {
		if(!error && historic && historic.length>0) {
			var userIds = []
			,	users = {};
			for(var i = 0; i<historic.length; i++) {
				userIds.push(historic[i].ownerId);
				userIds.push(historic[i].targetOwner);
			}

			provider.get.namesByIds(userIds, function(error, dbUsers) {
				if(!error && dbUsers) {
					if(dbUsers.id)
						users[dbUsers.id] = dbUsers.creator;
					else
						if(dbUsers.length > 0)
							for(var i = 0; i<dbUsers.length; i++)
								users[dbUsers[i].id] = dbUsers[i].creator;

					for(var i = 0; i<historic.length; i++) {
						historic[i].owner = historic[i].ownerId == parameters.userId ? 'You' : users[historic[i].ownerId];
						historic[i].targetOwner = historic[i].targetOwner == parameters.userId ? 'You' : users[historic[i].targetOwner];
						delete historic[i].ownerId
						delete historic[i]._id;
					}
				}

				callback.call(this, '', historic);
			})
		}
		else
			callback.call(this, 'an error has occured'+error);
	})
}

/********************************[  CREATE   ]********************************/

/**
 * Create an user object
 * @param  {object}   user user to create
 * @param  {Function} callback
 */
provider.create.user = function(user, callback) {
	provider.get.byEmail(user.email, function(error, data) {
		if(!data || data.length == 0) {
			try {
				var query = 'insert into `user` (`password`, `salt`, `photo`, `storage`, `firstname`, `lastname`, `inscriptiondate`, `birthdate`, `email`, `country`, `countrycode`, `activated`, `roleid`) values (';
				tools.generatePassword(user.password, function(data) {
					query += '"' + data.password + '","' + data.salt + '","' + user.photo + '", 0, "' +user.firstname + '","' + user.lastname + '", NOW(),"' + user.birthdate + '", "' + user.email + '", "' + user.country + '", "' + user.countryCode + '", ' + (user.activated ? 1 : 0) + ', ' + user.roleId + ')';
					Mysql.query(query, callback);
				})
			}
			catch(exception) { callback.call(this, 'user creation failed - ' + exception); }
		}
		else
			callback.call(this, 'user already exist');
	})

}

/********************************[  DELETE   ]********************************/

/**
 * Delete a user object
 * @param  {integer}   id       id of the object to delete
 * @param  {Function} callback
 */
provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `user` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

/**
 * Update the parameter password of an user
 * @param  {object}   user     user to update
 * @param  {Function} callback
 */
provider.update.password = function(user, callback) {
	tools.generatePassword(user.password, function(data) {

		Mysql.query('update `user` set `password`="' + data.password + '", `salt`="' + data.salt + '" where `id`=' + parseInt(user.id, 10) + ';', callback);
	})
}

/**
 * Update some parameters of an user
 * @param  {object}   user     user to update
 * @param  {Function} callback
 */
provider.update.informations = function(user, callback) {
	Mysql.query('update `user` set `firstname`="' + user.firstname + '", `lastname`="' + user.lastname + '", `birthdate`="' + user.birthdate + '", `country`="' + user.country + '", `countrycode`="' + user.countryCode + '" where `id`=' + parseInt(user.id, 10) + ';', callback);
}

/**
 * Update the parameter activated of an user
 * @param  {object}   user     user to update
 * @param  {Function} callback
 */
provider.update.activated = function(user, callback) {
	Mysql.query('update `user` set `activated`=' + (user.activated ? 1 : 0) + ' where `id`=' + parseInt(user.id, 10) + ';', callback);
}

/**
 * Update the parameter roleid of an user
 * @param  {object}   user     user to update
 * @param  {Function} callback
 */
provider.update.role = function(user, callback) {
	Mysql.query('update `user` set `roleid`=' + parseInt(user.roleId, 10) + ' where `id`=' + parseInt(user.id, 10) + ';', callback);
}

/**
 * Update the parameter photo of an user
 * @param  {object}   user     user to update
 * @param  {Function} callback
 */
provider.update.photo = function(user, callback) {
	 Mysql.query('update `user` set `photo`="' + user.photo + '" where `id`=' + parseInt(user.id, 10) + ';', callback);
}

/**
 * Update the parameter storage of an user
 * @param  {object}   user     user to update
 * @param  {Function} callback
 */
provider.update.storage = function(userId, value, callback) {
	Mysql.query('update `user` set `storage`=`storage`+' + parseInt(value, 10) + ' where `id`=' + parseInt(userId, 10) + ';', callback);
}

/********************************[  OTHERS   ]********************************/

/**
 * Check if email and password are valid
 * @param  {string}   email    email to check
 * @param  {string}   password password to check
 * @param  {Function} callback
 */
provider.connect = function(email, password, callback) {
	provider.get.byEmail(email, function(error, user) {
		var goodPassword = user.password ? tools.checkPassword(password, user.password, user.salt) : false;
		var userResult = (user.activated && goodPassword) ? user : null;
		callback(error, userResult);
	});
}

/**
 * Check if id and password are valid
 * @param  {string}   id    id to check
 * @param  {string}   password password to check
 * @param  {Function} callback
 */
provider.connectById = function(id, password, callback) {
	provider.get.byId(id, function(error, user) {
		var goodPassword = user.password ? tools.checkPassword(password, user.password, user.salt) : false;
		var userResult = (user.activated && goodPassword) ? user : null;
		callback(error, userResult);
	});
}

module.exports = provider;