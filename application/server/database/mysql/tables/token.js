var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `token`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `token` where `id` = "'+ id +'";', callback);
}

provider.get.byFileId = function(id, callback) {
    Mysql.query('select * from `token` where `fileid` = "'+ id +'";', callback);
}

provider.isValidForAuthentication = function(id, callback) {

    var witness = false;

    provider.get.byId(id, function(error, data) {
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
            callback.call(this, null, data.userid);
        else
            callback.call(this, 'bad token', null);
    });
}

/********************************[  CREATE   ]********************************/


provider.create.token = function(token, callback) {
	var query = 'insert into `token` (`id`, `expirationdate`, `type`, `origin`, `userid`, `fileid`) values (';
	query += '"' + token.id + '","' + token.expirationDate + '","' + token.type + '","' + token.origin + '",' + (token.userId ? parseInt(token.userId, 10) : null) + ',"' + (token.fileId || null) + '")';
	Mysql.query(query, callback);
}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `token` where `id`= "'+ id + '";', callback);
}

/********************************[  UPDATE   ]********************************/


module.exports = provider;