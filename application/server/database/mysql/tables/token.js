var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

/**
 * Get all token objects
 * @param  {Function} callback
 */
provider.get.all = function(callback) {
	Mysql.query('select * from `token`;', callback);
}

/**
 * Get a token object by it's id
 * @param  {integer}   id       id of the object to find
 * @param  {Function} callback
 */
provider.get.byId = function(id, callback) {
	Mysql.query('select * from `token` where `id` = "'+ id +'";', callback);
}

/**
 * Get a token object, and it's associed user, by it's id
 * @param  {integer}   id       id of the object to find
 * @param  {Function} callback
 */
provider.get.byIdWithUserName = function(id, callback) {
    Mysql.query('select * from `token` t join `user` u on t.`userid` = u.`id` where t.`id` = "'+ id +'";', callback);
}

/**
 * Get a token object by it's file id
 * @param  {integer}   id      file id used to get the object
 * @param  {Function} callback
 */
provider.get.byFileId = function(id, callback) {
    Mysql.query('select * from `token` where `fileid` = "'+ id +'";', callback);
}

/**
 * Check if a token is valid for authentication
 * @param  {integer}   id       token id used to check the validity
 * @param  {Function} callback
 */
provider.isValidForAuthentication = function(id, callback) {

    var witness = false;

    provider.get.byIdWithUserName(id, function(error, data) {
        if(data) {
            var currentDate = new Date()
            ,   expirationDate = new Date(data.expirationdate)

            if(((data.origin && data.origin.match(/CubbyHole/i)) || expirationDate >= currentDate) && data.type == 'AUTHENTICATION')
                witness = true;
            else
                if(data.TYPE == 'AUTHENTICATION')
                    tokenProvider.delete.byId(id, function(error, data) {
                        if(error)
                            console.log(error);
                    });
        }

        if(witness)
            callback.call(this, null, data);
        else
            callback.call(this, 'bad token', null);
    });
}

/********************************[  CREATE   ]********************************/

/**
 * Create a token object
 * @param  {object}   token token to create
 * @param  {Function} callback
 */
provider.create.token = function(token, callback) {
	var query = 'insert into `token` (`id`, `expirationdate`, `type`, `origin`, `userid`, `fileid`) values (';
	query += '"' + token.id + '","' + token.expirationDate + '","' + token.type + '","' + token.origin + '",' + (token.userId ? parseInt(token.userId, 10) : null) + ',"' + (token.fileId || null) + '")';
	Mysql.query(query, callback);
}

/********************************[  DELETE   ]********************************/

/**
 * Delete a token object
 * @param  {integer}   id       id of the object to delete
 * @param  {Function} callback
 */
provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `token` where `id`= "'+ id + '";', callback);
}

/********************************[  UPDATE   ]********************************/


module.exports = provider;