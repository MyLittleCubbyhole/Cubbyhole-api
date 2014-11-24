var db = require(global.paths.server + '/database/core').get().mongo
,	MongoDB = require('mongodb')
,	GridStore = MongoDB.GridStore
,	ObjectID = MongoDB.ObjectID
,	mongodb = {};

mongodb.get = function() { return { db: db, gridStore: GridStore, objectId: ObjectID }; };

module.exports = mongodb;