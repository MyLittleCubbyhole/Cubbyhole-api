/*Service requiring*/

	var KantoFS = require('kanto-tools-fs'),
		Path = require('path');

/*Class declaration*/

	class ConstantLoader {}

/*Static methods declarations*/

	ConstantLoader.init = init;

module.exports = ConstantLoader;

/*Static methods definitions*/

	function init() {
		global.paths = {};
		global.paths.versions = {};
		global.paths.app = __dirname;
		global.paths.vendors = Path.normalize(global.paths.app + '/vendors');
		global.paths.logs = Path.normalize(global.paths.app + '/logs');
		global.paths.root = Path.normalize(global.paths.app + '/..');
		global.paths.bin = Path.normalize(global.paths.app + '/bin');
		global.paths.server = Path.normalize(global.paths.root + '/server' );
		global.paths.web = Path.normalize(global.paths.root + '/web/' + (process.env.npm_package_config_env === 'prod' ? 'dist' : 'src') );
		global.paths.webSrc = Path.normalize(global.paths.root + '/web/src');
		global.paths.webDist = Path.normalize(global.paths.root + '/web/dist');
		global.paths.webRoot = Path.normalize(global.paths.root + '/web');
		global.paths.views = Path.normalize(global.paths.web + '/views');
		global.paths.assets = Path.normalize(global.paths.web + '/assets');

		var versions = KantoFS.getDirectoriesSync(global.paths.server);
		for(var i in versions)
			global.paths.versions[i] = Path.normalize(versions[i]);
	}