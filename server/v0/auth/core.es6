/*Parent class cloning*/

	var Module = require('kanto-patterns').module.clone(__dirname);

/*Attributes definitions*/

	Module._name = 'Auth';
	Module._routing = true;

/*Overridden methods declarations*/

	//Module.init = init;
	//Module.socketInit = socketInit;

module.exports = Module;

/*Overridden methods definitions*/

	//function init(app) { 
	//	/*Do Something*/ 
	//}

	//function socketInit(sockets, socket) {
	//	/*Do Something*/
	//}