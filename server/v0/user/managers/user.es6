/*Parent class cloning*/

	var Manager = require('kanto-patterns').manager.clone();

/*Factory requiring*/

	var SharingFactory = require('..todo..'),
		HistoricFactory = require('..todo..'),
		UserFactory = require(__dirname + '/../factories/user');

/*Service requiring*/

	var Security = require('kanto-tools-security');

/*Attributes definitions*/

	Manager._name = 'User';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Manager.get.usersBySharing = getUsersBySharing;
	Manager.get.historic = getHistoric;

	Manager.create.user = createUser;

	Manager.update.password = updateUserPassword;

module.exports = Manager;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function createUser(model) {
		return UserFactory.get.byEmail(model.email)
			.then(() => { throw Error('UserAlreadyExist'); },
			() => Security.generateHash(model.password))
			.then((result) => {
				model.hash = result.hash;
				model.salt = result.salt;
				return UserFactory.create(model);
			});
	}

	function updateUserPassword(model) {
		return Security.generateHash(model.password)
			.then((result) => UserFactory.update.password(model.id, result.hash, result.salt));
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

				return UserFactory.get.emailsByIds(userIds);
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

				return UserFactory.get.namesByIds(userIds);
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
