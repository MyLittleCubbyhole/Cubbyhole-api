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
		// router.get('route', /*controller*/);
	}