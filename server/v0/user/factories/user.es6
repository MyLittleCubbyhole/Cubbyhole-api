/*Parent class cloning*/

	var MysqlFactory = require('kanto-patterns-mysql').mysqlFactory.clone();

/*Factory requiring*/

	var SharingFactory = require('..todo..'),
		HistoricFactory = require('..todo..');

	var Security = require('kanto-tools-security');

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
	MysqlFactory.get.byEmail = getByEmail;
	MysqlFactory.get.byEmailLike = getByEmailLike;
	MysqlFactory.get.byEmailAndRole = getByEmailAndRole;
	MysqlFactory.get.byRole = getByRole;
	MysqlFactory.get.namesByIds = getNamesByIds;
	MysqlFactory.get.bandwidth = getBandwidth;
	MysqlFactory.get.emailsbyIds = getEmailsbyIds;
	MysqlFactory.get.usersBySharding = getUsersBySharing;
	MysqlFactory.get.historic = getHistoric;

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

	function getUsersBySharing(fullPath) {

		var userIds = []
		,	users = {}
		,	usersTab = [];

		return SharingFactory.get.byItemFullPath(fullPath)
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
					throw Error('EmptyReturn');

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


	function getHistoric(id, offset = 0, limit = 50) {

		var userIds = [],
			users = {},
			historic;

		return HistoricFactory.get.byUser(offset, limit)
			.then((dbHistoric) => {
				if(dbHistoric.length === 0)
					throw Error('EmptyReturn');

				historic = dbHistoric;
				for(var i = 0; i<dbHistoric.length; i++) {
					userIds.push(dbHistoric[i].ownerId);
					userIds.push(dbHistoric[i].targetOwner);
				}

				return this.get.namesByIds(userIds);
			})
			.then((dbUsers) => {
				if(dbUsers.length === 0)
					throw Error('EmptyReturn');

				var i;

				for(i = 0; i<dbUsers.length; i++)
					users[dbUsers[i].id] = dbUsers[i].creator;

				for(i = 0; i<historic.length; i++) {
					let isOwner = historic[i].ownerId === id;
					let isTargetOwner = historic[i].targetOwner === id;
					//PillowTag : a check
					historic[i] = HistoricFactory.reduce(historic[i]);

					historic[i].owner = isOwner ? 'You' : users[historic[i].ownerId];
					historic[i].targetOwner = isTargetOwner ? 'You' : users[historic[i].targetOwner];
				}

				return historic;
			});
	}

	function createUser(model) {
		return this.get.byEmail(model.email)
			.then(() => { throw Error('UserAlreadyExist'); },
			() => Security.generateHash(model.password))
			.then((result) => {

				var query = 'INSERT INTO `user` (`password`, `salt`, `photo`, `storage`, `firstname`, `lastname`, `inscriptiondate`, `birthdate`, `email`, `country`, `countrycode`, `activated`, `roleid`)\
					VALUES ("' + result.hash + '",\
					"' + result.salt + '",\
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
			}); 
	}