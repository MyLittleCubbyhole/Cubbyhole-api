/*Parent class cloning*/

	var Routing = require('kanto-patterns').routing.clone(__dirname);

/*Attributes definitions*/

	Routing._prefix = '/';
	Routing._versioning = true;

/*Overridden methods declarations*/

	//Routing.init = init;
	Routing.declare = declare;

module.exports = Routing;

/*Overridden methods definitions*/

	//function init(app) { 
	//	/*Do Something*/ 
	//}

	function declare(router) {
		router.get('/users', this.controllers.user.get.all);
	}