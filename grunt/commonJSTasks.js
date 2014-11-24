module.exports = CommonJSTasks;

/**
 * Common javascript grunt task presets
 * available commands :
 * 	- 6to5:allEs6Files
 * 	- 6to5:appEs6Files
 * 	- 6to5:serverEs6Files
 * 	- 6to5:clientEs6Files
 * 	- 6to5:targeted
 * 	
 * @param {Object|Grunt} grunt Grunt instance
 */
function CommonJSTasks(grunt) {

	var configuration = {};

	/*6to5*/
		configuration['6to5'] = {};
		configuration['6to5'].allEs6Files = {
			options: {
				sourceMap: false
			},
			files: [{
				expand: true,
				cwd: global.paths.app,
				ext: '.js',
				src: ['**/*.es6', '!**/*.js'],
				dest: global.paths.app
			}, {
				expand: true,
				cwd: global.paths.server,
				ext: '.js',
				src: ['**/*.es6', '!**/*.js'],
				dest: global.paths.server
			}, {
				expand: true,
				cwd: global.paths.webSrc,
				ext: '.js',
				src: ['**/*.es6', '!**/*.js', '!assets/javascripts/libraries/**/*'],
				dest: global.paths.webSrc
			}]
		};
		configuration['6to5'].appEs6Files = {
			options: {
				sourceMap: false
			},
			files: [{
				expand: true,
				cwd: global.paths.app,
				ext: '.js',
				src: ['**/*.es6', '!**/*.js'],
				dest: global.paths.app
			}]
		};
		configuration['6to5'].serverEs6Files = {
			options: {
				sourceMap: false
			},
			files: [{
				expand: true,
				cwd: global.paths.server,
				ext: '.js',
				src: ['**/*.es6', '!**/*.js'],
				dest: global.paths.server
			}]
		};
		configuration['6to5'].clientEs6Files = {
			options: {
				sourceMap: false
			},
			files: [{
				expand: true,
				cwd: global.paths.webSrc,
				ext: '.js',
				src: ['**/*.es6', '!**/*.js', '!assets/javascripts/libraries/**/*'],
				dest: global.paths.webSrc
			}]
		};
		configuration['6to5'].watch = {
			options: {
				sourceMap: false
			},
			files: [{
				expand: true,
				cwd: '',
				ext: '.js',
				src: '',
				dest: ''
			}]
		};
		if(grunt.option.pathInfos)
			configuration['6to5'].targeted = {
				options: {
					sourceMap: false
				},
				files: [{
					expand: true,
					cwd: '',
					ext: '.js',
					src: grunt.option.pathInfos.path,
					dest: ''
				}]
			};


	return configuration;
}