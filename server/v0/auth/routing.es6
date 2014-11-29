/*Parent class cloning*/

	var Routing = require('kanto-patterns').routing.clone(__dirname);

/*Attributes definitions*/

	Routing._prefix = '/';
	Routing._versioning = true;

/*Overridden methods declarations*/

	//Routing.init = init;
	//Routing.socketInit = socketInit;
	Routing.declare = declare;

module.exports = Routing;

/*Overridden methods definitions*/

	//function init(app) { 
	//	/*Do Something*/ 
	//}

	//function socketInit(sockets, socket) {
	//	/*Do Something*/
	//}

	function declare(router) {
		router.get('/api/logout', this.controllers.auth.get.logout);
		router.get('/api/checkToken', this.controllers.auth.get.checkToken);
		router.post('/api/auth', this.controllers.auth.post.authenticate);
		router.get('/api/checkAdminToken', this.controllers.auth.get.checkToken);
	}