var Mysql = require(global.paths.server + '/database/mysql/core')
,   subscribeProvider = require(global.paths.server + '/database/mysql/tables/subscribe')
,   moment = require('moment')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

provider.get.all = function(callback) {
	Mysql.query('select * from `storage`;', callback);
}

provider.get.byId = function(id, callback) {
	Mysql.query('select * from `storage` where `id` = '+ parseInt(id, 10) +';', callback);
}

provider.get.bySubscribeId = function(subscribeId, callback) {
	Mysql.query('select * from `storage` where `subscribeid` = '+ parseInt(subscribeId, 10) +';', callback);
}

provider.get.current = function(subscribeId, callback) {
    provider.get.bySubscribeId(subscribeId, function(error, storage) {
        if(!error && storage) {
            if(storage.id) {
                if(moment(storage.day).isSame(moment(), 'day'))
                    callback.call(this, null, storage);
                else
                    callback.call(this, 'no storage found');
            } else if(storage.length > 0) {
                var storageFound = false;
                for(var i = 0; i < storage.length; i++) {
                   if(moment(storage[i].day).isSame(moment(), 'day')) {
                        callback.call(this, null, storage[i]);
                        storageFound = true;
                        break;
                    }
                }
                if(!storageFound)
                    callback.call(this, 'no storage found');
            } else {
                callback.call(this, 'no storage found');
            }
        } else
            callback.call(this, error);
    });
}

/********************************[  CREATE   ]********************************/


provider.create.storage = function(storage, callback) {
	var query = 'insert into `storage` (`value`,`day`,`subscribeid`) values (';
	query += storage.value + ',"' + storage.day + '",' + parseInt(storage.subscribeId, 10) + ')';
	Mysql.query(query, callback);
}

/********************************[  DELETE   ]********************************/

provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `storage` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

provider.update.value = function(userId, value, callback) {
	subscribeProvider.get.actualSubscription(userId, function(error, subscribe) {
        if(!error && subscribe && subscribe.id)
            provider.get.current(subscribe.id, function(error, storage) {
                if(!error && storage && storage.id) {
                    storage.value += value;
                    Mysql.query('update `storage` set `value`=' + parseInt(storage.value, 10) + ' where `id`=' + parseInt(storage.id, 10) + ';', callback);
                } else
                    provider.create.storage({value: value, day: moment().format('YYYY-MM-DD'), subscribeId: subscribe.id}, callback);
            });
        else {
            console.log(error);
            callback.call(this, 'error getting actual subscription');
        }
    });
}


module.exports = provider;