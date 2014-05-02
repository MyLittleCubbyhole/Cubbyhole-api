var Mysql = require(global.paths.server + '/database/mysql/core')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `subscribe`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `subscribe` where `id` = '+ parseInt(id, 10) +';', callback);
}

provider.get.actualSubscriptions = function(userId, callback) {
    var query = 'select * from `subscribe` where `userid` = '+ parseInt(userId, 10) +' and `datestart` < NOW() and `dateend` > NOW();';
    Mysql.query(query, callback);
}

provider.get.actualSubscription = function(userId, callback) {
    provider.get.actualSubscriptions(userId, function(error, subscriptions) {
        if(!error && subscriptions) {
            if(subscriptions.id) {
                callback.call(this, null, subscriptions);
            } else if(subscriptions.length > 0) {
                for(var i = 0; i < subscriptions.length; i++) {
                    if(subscriptions[i].id != 1) {
                        callback.call(this, null, subscriptions[i]);
                        break;
                    }
                }
            } else {
                callback.call(this, 'no subscription found');
            }
        } else
            callback.call(this, error);
    });
}

/********************************[  CREATE   ]********************************/


provider.create.subscribe = function(subscribe, callback) {
	var query = 'insert into `subscribe` (`userid`,`planid`,`datestart`,`dateend`) values (';
	query += parseInt(subscribe.userId, 10) + ',' + parseInt(subscribe.planId, 10) + ',"' + subscribe.dateStart + '","' + subscribe.dateEnd + '")';
	Mysql.query(query, callback);

}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `subscribe` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/



module.exports = provider;