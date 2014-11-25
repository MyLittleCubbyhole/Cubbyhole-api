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
	MysqlFactory.get.byEmailAndRole = getByEmailAndRole;
	MysqlFactory.get.byRole = getByRole;
	MysqlFactory.get.namesByIds = getNamesByIds;
	MysqlFactory.get.bandwidth = getBandwidth;
	MysqlFactory.get.emailsbyIds = getEmailsbyIds;
	MysqlFactory.get.usersBySharding = getUsersBySharing;

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

	function getUsersBySharing(fullPath) {

		var userIds = []
		,	users = {}
		,	usersTab = [];

		return sharingProvider.get.byItemFullPath(fullPath)
			.then((items) => {
				if(items.length === 0)
					throw Error('EmpyReturn');

				for(var i = 0; i<items.length; i++) {
					users[items[i].sharedWith] = {right: items[i].right};
					userIds.push(items[i].sharedWith);
				}

				return this.get.emailsbyIds(userIds);
			})
			.then((dbUsers) => {
				if(dbUsers.length === 0)
					throw Error('EmpyReturn');

				for(var i = 0; i<dbUsers.length; i++) {
					users[dbUsers[i].id].email = dbUsers[i].email;
					users[dbUsers[i].id].photo = dbUsers[i].photo;
					users[dbUsers[i].id].firstname = dbUsers[i].firstname;
					users[dbUsers[i].id].lastname = dbUsers[i].lastname;
					usersTab.push(users[dbUsers[i].id]);
				}

				return usersTab;
			});
	}