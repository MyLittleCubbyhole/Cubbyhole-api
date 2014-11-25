/*Parent class cloning*/

	var MysqlFactory = require('kanto-patterns-mysql').mysqlFactory.clone();

/*Attributes definitions*/

	MysqlFactory._name = 'User';
	MysqlFactory._table = 'User';

/*Model definition*/

	MysqlFactory.model.password = '';
	MysqlFactory.model.salt = '';
	MysqlFactory.model.photo = '';
	MysqlFactory.model.storage = 0;
	MysqlFactory.model.firstname = '';
	MysqlFactory.model.lastname = '';
	MysqlFactory.model.inscriptiondate = new Date();
	MysqlFactory.model.birthdate = new Date();
	MysqlFactory.model.email = '';
	MysqlFactory.model.country = '';
	MysqlFactory.model.countrycode = '';
	MysqlFactory.model.activated = false;
	MysqlFactory.model.roleid = 0;

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MysqlFactory.get.all = getAllUsers;
	MysqlFactory.get.byId = getById;
	MysqlFactory.get.byEmail = getByEmail;
	MysqlFactory.get.byEmailLike = getByEmailLike;

module.exports = MysqlFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getAllUsers(offset = 0, limit = 100) {

		var temp;
		if(limit < offset) {
			temp = limit;
			limit = offset;
			offset = temp;
		}

		return MysqlFactory.query('select * from `user` where id>1 LIMIT ' + offset + ',' + limit + ';');
	}

	function getById(id) {

		return MysqlFactory.query('select * from `user` where `id` = ' + parseInt(id, 10) + ';');	
	}

	function getByEmail(email) {

		return MysqlFactory.query('select * from `user` where `email`="'+ email + '";');
	}

	function getByEmailLike(email, offset = 0, limit = 100) {

		var temp;
		if(limit < offset) {
			temp = limit;
			limit = offset;
			offset = temp;
		}

		return MysqlFactory.query('select * from `user` where `email` LIKE "%'+ email + '%" and id>1 LIMIT ' + offset + ',' + limit + ';');
	}