/*Bin requiring*/

	var Kernel = require(global.paths.bin + '/kernel');

/*Services requiring*/

	var bodyParser = require('body-parser'),
		compress = require('compression'),
		jade = require('jade'),
		express = require('express'),
		i18n = require('kanto-i18n'),
		errorHandler = require('kanto-error-handler');

/*Kernel methods overriding*/

	Kernel.beforeAll = beforeAll;
	Kernel.afterAll = afterAll;
	Kernel.onDbLoaded = onDbLoaded;

module.exports = Kernel;

/*Kernel methods definitions*/

	function beforeAll(app) {
		app.engine('jade', jade.__express);
		app.set('view engine', 'jade');
		app.set('views', global.paths.views);
		app.use(compress());
		app.use(bodyParser.urlencoded({ extended: true, inflate: true }));
		app.use(bodyParser.json());
		app.use(express.static(global.paths.assets));
		app.use(i18n.tools.get().handle);
	}

	function afterAll(app) {
		errorHandler.set(app);
	}

	function onDbLoaded(app) {
		i18n.tools.config(app);
	}
