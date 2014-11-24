module.exports = TestTasks;

/**
 * Test grunt task presets
 * available commands :
 * 	- jasmine_node:app
 * 	- jasmine_node:version --apiVersion=xx
 * 	
 * @param {Object|Grunt} grunt Grunt instance
 */
function TestTasks(grunt) {

	var configuration = {};

	/*JASMINE NODE*/
		configuration.jasmine_node = {};
		configuration.jasmine_node.app = {
			options: {
				forceExit: true,
				jUnit: { report: false }
			},
			files: [{
				expand: true,
				cwd: global.paths.server,
				src: ['**/spec/coreSpec.js'],
				dest: global.paths.server
			}]
		};

		var apiVersion = grunt.option('apiversion');
		if(apiVersion)
			configuration.jasmine_node.version = {
				options: {
					forceExit: true,
					jUnit: { report: false }
				},
				files: [{
					expand: true,
					cwd: global.paths.server,
					src: [apiVersion + '/**/spec/coreSpec.js'],
					dest: global.paths.server
				}]
			};

	/*KARMA*/
		configuration.karma = {
			unit: {
				configFile: 'karma.config.js'
			}
		};

	return configuration;
}