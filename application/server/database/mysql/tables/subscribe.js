var Mysql = require(global.paths.server + '/database/mysql/core')
,   moment = require('moment')
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
                var subscriptionFound = false;
                for(var i = 0; i < subscriptions.length; i++) {
                    if(subscriptions[i].id != 1 && !subscriptions[i].paused) {
                        subscriptionFound = true;
                        callback.call(this, null, subscriptions[i]);
                        break;
                    }
                }
                if(!subscriptionFound) {
                    var subscriptionToUnpause = null;
                    for(var i = 0; i < subscriptions.length; i++)
                        if(subscriptions[i].paused && (!subscriptionToUnpause || (moment(subscriptionToUnpause.datestart).isBefore(moment(subscriptions[i].datestart)))))
                            subscriptionToUnpause = subscriptions[i];

                    if(subscriptionToUnpause) {
                        subscriptionToUnpause.paused = false;
                        subscriptionToUnpause.dateend = moment(moment().valueOf() + subscriptionToUnpause.remainingtime).format('YYYY-MM-DD HH:mm:ss');
                        subscriptionToUnpause.remainingtime = 0;
                        provider.update.pause(subscriptionToUnpause, function(error, data) {
                            callback.call(this, error, subscriptionToUnpause);
                        });
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
	var query = 'insert into `subscribe` (`userid`,`planid`,`datestart`,`dateend`, `paused`, `remainingtime`) values (';
	query += parseInt(subscribe.userId, 10) + ',' + parseInt(subscribe.planId, 10) + ',"' + subscribe.dateStart + '","' + subscribe.dateEnd + '", 0, 0)';
	Mysql.query(query, callback);

}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `subscribe` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

provider.update.pause = function(subscribe, callback) {
    Mysql.query('update `subscribe` set `dateend`="' + subscribe.dateend + '", `paused`=' + (subscribe.paused ? 1 : 0) + ', `remainingtime`=' + parseInt(subscribe.remainingtime, 10) + ' where `id`='+ parseInt(subscribe.id, 10) + ';', callback);
}



module.exports = provider;