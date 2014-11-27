var Mysql = require(global.paths.server + '/database/mysql/core')
,   moment = require('moment')
,	provider = { get: {}, create: {}, delete: {}, update: {} };

/********************************[  GET   ]********************************/

/**
 * Get all daily_quota objects
 * @param  {Function} callback
 */
provider.get.all = function(callback) {
	Mysql.query('select * from `daily_quota`;', callback);
}

/**
 * Get a daily_quota object by it's id
 * @param  {integer}   id       id of the object to find
 * @param  {Function} callback
 */
provider.get.byId = function(id, callback) {
	Mysql.query('select * from `daily_quota` where `id` = '+ parseInt(id, 10) +';', callback);
}

/**
 * Get daily_quota objects by their subscribe id
 * @param  {int}   subscribeId subscribe id used to get the daily_quota
 * @param  {Function} callback    [description]
 * @return {[type]}               [description]
 */
provider.get.bySubscribeId = function(subscribeId, callback) {
	Mysql.query('select * from `daily_quota` where `subscribeid` = '+ parseInt(subscribeId, 10) +';', callback);
}

/**
 * Get the current daily_quota for a subscribe
 * @param  {integer}   subscribeId subscribe id used to get the daily_quota
 * @param  {Function} callback
 */
provider.get.current = function(subscribeId, callback) {
    provider.get.bySubscribeId(subscribeId, function(error, dailyQuota) {
        if(!error && dailyQuota) {
            if(dailyQuota.id) {
                if(moment(dailyQuota.day).isSame(moment(), 'day'))
                    callback.call(this, null, dailyQuota);
                else
                    callback.call(this, 'no dailyQuota found');
            } else if(dailyQuota.length > 0) {
                var dailyQuotaFound = false;
                for(var i = 0; i < dailyQuota.length; i++) {
                   if(moment(dailyQuota[i].day).isSame(moment(), 'day')) {
                        callback.call(this, null, dailyQuota[i]);
                        dailyQuotaFound = true;
                        break;
                    }
                }
                if(!dailyQuotaFound)
                    callback.call(this, 'no dailyQuota found');
            } else {
                callback.call(this, 'no dailyQuota found');
            }
        } else
            callback.call(this, error);
    });
}

/********************************[  CREATE   ]********************************/

/**
 * Create a daily_quota object
 * @param  {object}   dailyQuota dailyQuota to create
 * @param  {Function} callback
 */
provider.create.dailyQuota = function(dailyQuota, callback) {
	var query = 'insert into `daily_quota` (`day`,`quotaused`,`subscribeid`) values ("';
	query += dailyQuota.day + '",' + parseInt(dailyQuota.quotaUsed, 10) + ',' + parseInt(dailyQuota.subscribeId, 10) + ')';
	Mysql.query(query, callback);
}

/********************************[  DELETE   ]********************************/

/**
 * Delete a daily_quota object
 * @param  {integer}   id       id of the object to delete
 * @param  {Function} callback
 */
provider.delete.byId = function(id, callback) {
	Mysql.query('delete from `daily_quota` where `id`='+ parseInt(id, 10) + ';', callback);
}

/********************************[  UPDATE   ]********************************/

/**
 * Update the property quota used of a daily_quota object
 * @param  {[type]}   dailyQuota daily_quota to update
 * @param  {Function} callback
 */
provider.update.quotaUsed = function(dailyQuota, callback) {
	Mysql.query('update `daily_quota` set `quotaused`=' + parseInt(dailyQuota.quotaUsed, 10) + ' where `id`=' + parseInt(dailyQuota.id, 10) + ';', callback);
}

/**
 * Update a daily quota
 * @param  {integer} quotaId        id of the quota to update
 * @param  {integer} quotaAvailable available quota
 * @param  {inter} planQuota        max usable quota
 */
provider.update.dailyQuota = function(quotaId, quotaAvailable, planQuota) {
    provider.get.byId(quotaId, function(error, dailyQuota) {
        if(!error && dailyQuota && dailyQuota.id) {
            dailyQuota.quotaUsed = planQuota - quotaAvailable;
            provider.update.quotaUsed(dailyQuota, function(error, data) {
                if(error)
                    console.log(error);
            })
        }
    })
}


module.exports = provider;