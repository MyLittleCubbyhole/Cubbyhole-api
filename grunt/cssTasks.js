module.exports = CssTasks;

/**
 * Css grunt task presets
 * available commands :
 * 	- sass:app
 * 	
 * @param {Object|Grunt} grunt Grunt instance
 */
function CssTasks(grunt) {

	var configuration = {};

	/*SASS*/
		configuration.sass = {
			app : {
				options: {
					sourcemap: 'none'
				},
				files: [{
					expand: true,
					cwd: global.paths.webSrc + '/assets/styles/',
					src: ['core.scss'],
					dest: global.paths.webSrc + '/assets/styles/',
					ext: '.css'
				}]
			}
		};

	return configuration;
}