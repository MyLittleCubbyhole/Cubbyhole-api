/*Service requiring*/
var Path = require('path');

module.exports = Grunt;

function Grunt(grunt) {

	var Configuration = {};
	Configuration.package = grunt.file.readJSON('package.json');

	try {
		process.env.npm_package_config_env = process.env.npm_package_config_env || Configuration.package.config.env;
		require(__dirname + '/app/constantLoader').init();
		require(__dirname + '/app/configLoader').init();
	}
	catch(exception) {
		global.paths = {};
		global.paths.app = Path.normalize(__dirname + '/app');
		global.paths.server = Path.normalize(__dirname + '/server');
		global.paths.webRoot = Path.normalize(__dirname + '/web');
		global.paths.webSrc = Path.normalize(__dirname + '/web/src');
		global.paths.webDist = Path.normalize(__dirname + '/web/dist');
	}

	require('time-grunt')(grunt);
	require('jit-grunt')(grunt, {
		'6to5': 'grunt-6to5',
		'add_comment': 'grunt-add-comment',
		'johto_require': 'johto-require',
		'clean': 'grunt-contrib-clean',
		'apidoc': 'grunt-apidoc',
		'sass': 'grunt-contrib-sass',
		'jadeUsemin': 'grunt-jade-usemin',
		'concat': 'grunt-contrib-concat',
		'cssmin': 'grunt-contrib-cssmin',
		'uglify': 'grunt-contrib-uglify',
		'html2js': 'grunt-html2js',
		'sprite': 'grunt-spritesmith',
		'imagemin': 'grunt-contrib-imagemin',
		'copy': 'grunt-contrib-copy',
		'watch': 'grunt-contrib-watch',
		'jasmine_node': 'grunt-jasmine-node',
		'johto_i18n_parse': 'johto-i18n-parse',
		'karma': 'grunt-karma'
	});

	var pathOption = grunt.option('path');
	if(pathOption)
		grunt.option.pathInfos = extractInformationsFromPath(pathOption);

	/*Presets loading*/
	var UtilsTasks = require(__dirname + '/grunt/utilsTasks')(grunt),
		ServerJSTasks = require(__dirname + '/grunt/serverJSTasks')(grunt),
		CssTasks = require(__dirname + '/grunt/cssTasks')(grunt),
		HtmlTasks = require(__dirname + '/grunt/htmlTasks')(grunt),
		I18nTasks = require(__dirname + '/grunt/i18nTasks')(grunt),
		ImageTasks = require(__dirname + '/grunt/imageTasks')(grunt),
		TestTasks = require(__dirname + '/grunt/testTasks')(grunt),
		CommonJSTasks = require(__dirname + '/grunt/commonJSTasks')(grunt),
		WatchTasks = require(__dirname + '/grunt/watchTasks')(grunt);

	Configuration.add_comment = UtilsTasks.add_comment;
	Configuration.clean = UtilsTasks.clean;
	Configuration.apidoc = UtilsTasks.apidoc;
	Configuration.copy = UtilsTasks.copy;
	Configuration.johto_require = ServerJSTasks.johto_require;
	Configuration['6to5'] = CommonJSTasks['6to5'];
	Configuration.sass = CssTasks.sass;
	Configuration.jadeUsemin = HtmlTasks.jadeUsemin;
	Configuration.html2js = HtmlTasks.html2js;
	Configuration.sprite = ImageTasks.sprite;
	Configuration.imagemin = ImageTasks.imagemin;
	Configuration.jasmine_node = TestTasks.jasmine_node;
	Configuration.karma = TestTasks.karma;
	Configuration.johto_i18n_parse = I18nTasks.johto_i18n_parse;
	Configuration.watch = WatchTasks.watch;

	grunt.initConfig(Configuration);

	grunt.registerTask('es6', ['clean:allGeneratedJSFiles', '6to5:allEs6Files', 'johto_require:allGeneratedFiles', 'add_comment:allGeneratedFiles']);
	// sublime text build : "cmd": ["grunt.cmd", "es6:sublimebuild", "--path", "$file"]
	grunt.registerTask('es6:sublimebuild', ['clean:generatedFromTarget', '6to5:targeted', 'johto_require:generatedFromTarget', 'add_comment:generatedFromTarget']);
	grunt.registerTask('generate:doc', ['es6', 'clean:doc', 'apidoc:app']);
	grunt.registerTask('deploy:web:dev', ['clean:webSrcGeneratedFiles','sprite:dev','sass:app','html2js:app','6to5:clientEs6Files','add_comment:webSrcGeneratedFiles']);
	grunt.registerTask('deploy:web:dist', ['clean:webSrcGeneratedFiles','clean:webDist','clean:doc','6to5:clientEs6Files','copy:webSrcFontsToWebDist','sprite:dist','sass:app','html2js:app','jadeUsemin:dist','imagemin:dist','add_comment:dist','apidoc:app','clean:webSrcGeneratedFiles']);
	grunt.registerTask('deploy:dev', ['clean:allGeneratedFiles','6to5:allEs6Files','johto_require:allGeneratedFiles','sprite:dev','sass:app','html2js:app','add_comment:allGeneratedFiles']);
	grunt.registerTask('deploy:dist', ['clean:allGeneratedFiles','6to5:allEs6Files', 'johto_require:allGeneratedFiles','copy:webSrcFontsToWebDist','sprite:dist','sass:app','html2js:app','jadeUsemin:dist','imagemin:dist','apidoc:app','clean:webSrcGeneratedFiles','add_comment:allGeneratedFiles']);
	grunt.registerTask('watch:dev', ['deploy:dev', 'watch:app']);

}	

function extractInformationsFromPath(path) {
	var pathInformations = {};
	pathInformations.path = Path.normalize(path).replace(__dirname, '');
	pathInformations.pathFromApp = Path.normalize(path).replace(global.paths.app, '');
	pathInformations.pathFromServer = Path.normalize(path).replace(global.paths.server, '');
	pathInformations.pathFromWeb = Path.normalize(path).replace(global.paths.webRoot, '');
	pathInformations.pathFromWebSrc = Path.normalize(path).replace(global.paths.webSrc, '');
	pathInformations.pathFromWebDist = Path.normalize(path).replace(global.paths.webDist, '');
	pathInformations.extension = Path.extname(path);

	for(var i in pathInformations)
		if(pathInformations[i].slice(0,1) === '\\')
			pathInformations[i] = pathInformations[i].slice(1);

	return pathInformations;
}