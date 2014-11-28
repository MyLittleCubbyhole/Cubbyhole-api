/*Parent class cloning*/

	var MysqlFactory = require('kanto-patterns-mysql').mysqlFactory.clone();

/*Attributes definitions*/

	MysqlFactory._name = 'Token';
	MysqlFactory._table = 'token';

/*Model definition*/

	MysqlFactory.model.userId = null;
	MysqlFactory.model.fileId = null;
	MysqlFactory.model.type = '';
	MysqlFactory.model.expirationDate = new Date();
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
		return MysqlFactory.query('select * from `token`;');
	}

	function getByFileId(fileId) {
		return MysqlFactory.query('select * from `token` where `fileid` = "'+ fileId +'";');
	}

	function createToken(model) {

		var query = 'INSERT INTO `token` (`id`, `expirationdate`, `type`, `origin`, `userid`, `fileid`)\
			VALUES ("' + model.id + '",\
					"' + model.expirationDate + '",\
					"' + model.type + '",\
					"' + model.origin + '",' +
					(model.userId ? parseInt(model.userId, 10) : null) + ',' +
        			'"' + (model.fileId || null) + '")';
		return MysqlFactory.query(query);
	}

	function deleteByFileId(fileId) {
		return MysqlFactory.query('delete from `token` where `fileid`= "'+ fileId + '";');
	}