/*Parent class cloning*/

	var MongoFactory = require('kanto-patterns-mongodb').factory.clone();

/*Service requiring*/

	var moment = require('moment');

/*Attributes definitions*/

	MongoFactory._name = 'File';
	MongoFactory._collectionName = 'directories';

/*Model definition*/

	MongoFactory.model._id = '';
	MongoFactory.model.ownerId = -1;
	MongoFactory.model.creatorId = -1;
	MongoFactory.model.path = '/';
	MongoFactory.model.name = '';
	MongoFactory.model.type = 'file';
	MongoFactory.model.lastUpdate = moment().format('YYY-MM-DD');
	MongoFactory.model.lastUpdateName = '';
	MongoFactory.model.downloads = 0;
	MongoFactory.model.size = 0;
	MongoFactory.model.shared = false;
	MongoFactory.model.itemId = '';
	MongoFactory.model.contentType = '';
	MongoFactory.model.md5 = '';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MongoFactory.get.fileById = getFileById;
	MongoFactory.update.md5 = updateMD5;
	MongoFactory.update.downloads = updateDownloads;
	MongoFactory.update.shared = updateShared;

module.exports = MongoFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getFileById(id) {
		return this.prepare()
			.then((collection) => new Promise((resolve, reject) => collection.findOne({_id: id, type: 'file'}, (error, result) => error ? reject(error) : resolve(result)) ));
	}

	function updateMD5(id, md5) {
		return this.update(id, {md5: md5});
	}

	function updateDownloads(id) {
		return this.prepare()
			.then((collection) => new Promise((resolve, reject) => collection.update( {'_id': id}, {$inc: { downloads: 1 }}, { safe : true }, (error) => error ? resolve() : reject(error) ) ) );
	}

	function updateShared(id, shared) {
		return this.update(id, {shared: !!shared});
	}