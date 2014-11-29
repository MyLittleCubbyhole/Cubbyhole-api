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
		this.loadDepsFilters('user');//load the user module filters
	}

	function declare(router) {
		router.get('/logout', this.controllers.auth.get.logout);
		router.get('/checkToken', 
			this.filters.token.verifyToken,
			this.controllers.auth.get.checkToken);
		router.get('/checkAdminToken', 
			this.filters.token.verifyToken,
			this.deps.user.filters.user.isAdministrator, 
			this.controllers.auth.get.checkToken);
		router.get('/activation', this.controllers.auth.get.activateAccount);
		router.post('/auth', this.controllers.auth.post.authenticate);
	}