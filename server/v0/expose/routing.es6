/*Parent class cloning*/

	var Routing = require('kanto-patterns').routing.clone(__dirname);

/*Attributes definitions*/

	Routing._prefix = '/expose';
	Routing._versioning = true;

/*Overridden methods declarations*/

	Routing.declare = declare;

module.exports = Routing;

/*Overridden methods definitions*/

	function declare(router) {}