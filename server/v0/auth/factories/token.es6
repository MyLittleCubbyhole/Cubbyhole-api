/*Parent class cloning*/

	var MysqlFactory = require('kanto-patterns-mysql').mysqlFactory.clone();

/*Services requiring*/

	var moment = require('moment');

/*Attributes definitions*/

	MysqlFactory._name = 'Token';
	MysqlFactory._table = 'token';

/*Model definition*/

	MysqlFactory.model.userId = null;
	MysqlFactory.model.fileId = null;
	MysqlFactory.model.type = '';
	MysqlFactory.model.expirationDate = moment().format('YYY-MM-DD');
	MysqlFactory.model.origin = '';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MysqlFactory.get.all = getAll;
	MysqlFactory.get.byFileId = getByFileId;
	MysqlFactory.create.token = createToken;
	MysqlFactory.delete.byFileId = deleteByFileId;

module.exports = MysqlFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getAll() {
		return this.query('select * from `token`;');
	}

	function getByFileId(fileId) {
		return this.query('select * from `token` where `fileid` = "'+ fileId +'";');
	}

	function createToken(model) {

		var query = 'INSERT INTO `token` (`id`, `expirationdate`, `type`, `origin`, `userid`, `fileid`)\
			VALUES ("' + model.id + '",\
					"' + model.expirationDate + '",\
					"' + model.type + '",\
					"' + model.origin + '",' +
					(model.userId ? parseInt(model.userId, 10) : null) + ',' +
        			'"' + (model.fileId || null) + '")';
		return this.query(query);
	}

	function deleteByFileId(fileId) {
		return this.query('delete from `token` where `fileid`= "'+ fileId + '";');
	}