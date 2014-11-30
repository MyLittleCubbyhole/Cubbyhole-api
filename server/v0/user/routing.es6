/*Parent class cloning*/

	var Routing = require('kanto-patterns').routing.clone(__dirname);

/*Attributes definitions*/

	Routing._prefix = '/api';
	Routing._versioning = true;

/*Overridden methods declarations*/

	Routing.init = init;
	Routing.declare = declare;

module.exports = Routing;

/*Overridden methods definitions*/

	function init() { 
		this.loadDepsFilters('auth');
	}

	function declare(router) {
		router.get('/users',
			this.deps.auth.filters.token.verifyToken,
			this.filters.user.isAdministrator,
			this.controllers.user.get.all);
		router.get('/users/:email',
			this.deps.auth.filters.token.verifyToken,
			this.controllers.user.get.byEmail);

		router.get('/users/:userId/historic',
			this.deps.auth.filters.token.verifyToken,
			this.filters.user.restrictUser,
			this.controllers.historic.get.byUser);
	}