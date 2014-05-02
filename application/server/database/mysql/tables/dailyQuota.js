var Mysql = require(global.paths.server + '/database/mysql/core')
,   moment = require('moment')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `daily_quota`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `daily_quota` where `id` = '+ parseInt(id, 10) +';', callback);
}

provider.get.bySubscribeId = function(subscribeId, callback) {
	Mysql.query('select * from `daily_quota` where `subscribeid` = '+ parseInt(subscribeId, 10) +';', callback);
}

provider.get.current = function(subscribeId, callback) {
    provider.get.bySubscribeId(subscribeId, function(error, dailyQuota) {
        if(!error && dailyQuota) {
            if(dailyQuota.id) {
                if(moment(dailyQuota.day).isSame(moment(), 'day'))
                    callback.call(this, null, dailyQuota);
                else
                    callback.call(this, 'no dailyQuota found');
            } else if(dailyQuota.length > 0) {
                for(var i = 0; i < dailyQuota.length; i++) {
                   if(moment(dailyQuota[i].day).isSame(moment(), 'day')) {
                        callback.call(this, null, dailyQuota[i]);
                        break;
                    }
                }
            } else {
                callback.call(this, 'no dailyQuota found');
            }
        } else
            callback.call(this, error);
    });
}

/********************************[  CREATE   ]********************************/


provider.create.dailyQuota = function(dailyQuota, callback) {
	var query = 'insert into `daily_quota` (`day`,`quotaused`,`subscribeid`) values ("';
	query += dailyQuota.day + '",' + parseInt(dailyQuota.quotaUsed, 10) + ',' + parseInt(dailyQuota.subscribeId, 10) + ')';
	Mysql.query(query, callback);
}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `daily_quota` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

provider.update.quotaUsed = function(dailyQuota, callback) {
	Mysql.query('update `daily_quota` set `quotaused`=' + parseInt(dailyQuota.quotaUsed, 10) + ' where `id`=' + parseInt(dailyQuota.id, 10) + ';', callback);
}


module.exports = provider;