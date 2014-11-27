module.exports = ServerSideJSTasks;

/**
 * Server side javascript grunt task presets
 * available commands :
 * 	- johto_require:allGeneratedFiles
 * 	- johto_require:generatedFromTarget
 * 	
 * @param {Object|Grunt} grunt Grunt instance
 */
function ServerSideJSTasks(grunt) {

	var configuration = {};

	/*JOHTO REQUIRE*/
		configuration.johto_require = {};
		configuration.johto_require.allGeneratedFiles = {
			options: {
				match: 'Symbol|Promise|regeneratorRuntime',
				insert: 'require("6to5/polyfill");\n'
			},
			files: [{
				expand: true,
				cwd: global.paths.app,
				src: ['**/*.js'],
				dest: global.paths.app
			}, {
				expand: true,
				cwd: global.paths.server,
				src: ['**/*.js'],
				dest: global.paths.server
			}]
		};
		configuration.johto_require.watch = {
			options: {
				match: 'Symbol|Promise|regeneratorRuntime',
				insert: 'require("6to5/polyfill");\n'
			},
			files: [{
				expand: true,
				cwd: '',
				src: '',
				dest: ''
			}]
		};
		if(grunt.option.pathInfos)
			configuration.johto_require.generatedFromTarget = {
				options: {
					match: 'Symbol|Promise|regeneratorRuntime',
					insert: 'require("6to5/polyfill");\n'
				},
				files: [{
					expand: true,
					cwd: global.paths.app,
					src: grunt.option.pathInfos.pathFromApp.replace('.es6', '.js'),
					dest: global.paths.app
				}, {
					expand: true,
					cwd: global.paths.server,
					src: grunt.option.pathInfos.pathFromServer.replace('.es6', '.js'),
					dest: global.paths.server
				}]
			};

	return configuration;
}