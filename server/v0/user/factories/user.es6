/*Parent class cloning*/

	var MysqlFactory = require('kanto-patterns-mysql').mysqlFactory.clone();

/*Services requiring*/

	var moment = require('moment');

/*Attributes definitions*/

	MysqlFactory._name = 'User';
	MysqlFactory._table = 'User';

/*Model definition*/

	MysqlFactory.model._password = '';
	MysqlFactory.model._salt = '';
	MysqlFactory.model.photo = '';
	MysqlFactory.model.storage = 0;
	MysqlFactory.model.firstname = '';
	MysqlFactory.model.lastname = '';
	MysqlFactory.model.inscriptionDate = moment().format('YYY-MM-DD');
	MysqlFactory.model.birthdate = moment().format('YYY-MM-DD');
	MysqlFactory.model.email = '';
	MysqlFactory.model.country = '';
	MysqlFactory.model.countryCode = '';
	MysqlFactory.model.activated = false;
	MysqlFactory.model.roleId = null;

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MysqlFactory.get.all = getAllUsers;
	MysqlFactory.get.byEmail = getByEmail;
	MysqlFactory.get.byEmailLike = getByEmailLike;
	MysqlFactory.get.byEmailAndRole = getByEmailAndRole;
	MysqlFactory.get.byRole = getByRole;
	MysqlFactory.get.namesByIds = getNamesByIds;
	MysqlFactory.get.bandwidth = getBandwidth;
	MysqlFactory.get.emailsByIds = getEmailsbyIds;

	MysqlFactory.update.password = updatePassword;
	MysqlFactory.update.informations = updateInformations;
	MysqlFactory.update.activated = updateActivated;
	MysqlFactory.update.role = updateRole;
	MysqlFactory.update.photo = updatePhoto;
	MysqlFactory.update.storage = updateStorage;

	MysqlFactory.create = createUser;

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

	function getByEmailAndRole(email, role, offset = 0, limit = 100) {

		var temp;
		if(limit < offset) {
			temp = limit;
			limit = offset;
			offset = temp;
		}
		
		return MysqlFactory.query('select * from `user` where `email` LIKE "%'+ email + '%" and `roleid`='+ parseInt(role, 10) +' and id>1 LIMIT ' + offset + ',' + limit + ';');
	}

	function getByRole(role, offset = 0, limit = 100) {

		var temp;
		if(limit < offset) {
			temp = limit;
			limit = offset;
			offset = temp;
		}
		
		return MysqlFactory.query('select * from `user` where `roleid`='+ parseInt(role, 10) +' and id>1 LIMIT ' + offset + ',' + limit + ';');
	}
	
	function getNamesByIds(ids = []) {
	
		return MysqlFactory.query('select id, concat(firstname, " ", lastname) as creator from `user` where `id` IN ('+ ids.join(',') +');');
	}
	
	function getBandwidth(id = -1) {

		return MysqlFactory.query('select u.id as id, p.downloadbandwidth as download, p.uploadbandwidth as upload \
			from cubbyhole.plan p \
			inner join cubbyhole.subscribe s on p.id = s.planid \
			inner join cubbyhole.user u on u.id = s.userid \
			where u.id = ' + id + ' \
			and s.paused = 0 \
			and NOW() between s.datestart \
			and s.dateend;');
	}
	
	function getEmailsbyIds(ids = []) {
		return MysqlFactory.query('select id, photo, email, firstname, lastname from `user` where `id`in('+ ids.join(',') +');');
	}

	function getEmailsbyIds(ids = []) {
		return MysqlFactory.query('select id, photo, email, firstname, lastname from `user` where `id`in('+ ids.join(',') +');');
	}

	function createUser(model) {

		var query = 'INSERT INTO `user` (`password`, `salt`, `photo`, `storage`, `firstname`, `lastname`, `inscriptiondate`, `birthdate`, `email`, `country`, `countrycode`, `activated`, `roleid`)\
			VALUES ("' + model.hash + '",\
			"' + model.salt + '",\
			"' + model.photo + '",\
			0,\
			"' +model.firstname + '",\
			"' + model.lastname + '",\
			NOW(),\
			"' + model.birthdate + '",\
			"' + model.email + '",\
			"' + model.country + '",\
			"' + model.countryCode + '",\
			' + (model.activated ? 1 : 0) + ',\
			' + model.roleId + ')';

		return MysqlFactory.query(query);
	}

	function updatePassword(id, hash, salt) {
		return MysqlFactory.query('update `user` set `password`="' + hash + '", `salt`="' + salt + '" where `id`=' + parseInt(id, 10) + ';');
	}

	function updateInformations(id, model) {
		return MysqlFactory.query('update `user` set `firstname`="' + model.firstname + '", `lastname`="' + model.lastname + '", `birthdate`="' + model.birthdate + '", `country`="' + model.country + '", `countrycode`="' + model.countryCode + '" where `id`=' + parseInt(id, 10) + ';');
	}

	function updateActivated(id, activated = false) {
		return MysqlFactory.query('update `user` set `activated`=' + (activated ? 1 : 0) + ' where `id`=' + parseInt(id, 10) + ';');
	}

	function updateRole(id, roleId=-1) {
		return MysqlFactory.query('update `user` set `roleid`=' + parseInt(roleId, 10) + ' where `id`=' + parseInt(id, 10) + ';');
	}

	function updatePhoto(id, photo) {
		return MysqlFactory.query('update `user` set `photo`="' + photo + '" where `id`=' + parseInt(id, 10) + ';');
	}

	function updateStorage(id, storage) {
		return MysqlFactory.query('update `user` set `storage`=`storage`+' + parseInt(storage, 10) + ' where `id`=' + parseInt(id, 10) + ';');
	}