module.exports = HtmlTasks;

/**
 * Html grunt task presets
 * available commands :
 * 	- jadeUsemin:dist
 * 	- html2js:app
 * 	
 * @param {Object|Grunt} grunt Grunt instance
 */
function HtmlTasks(grunt) {

	var configuration = {};

	/*JADE USEMIN*/
		configuration.jadeUsemin = {
			dist: {
				options: {
					prefix: 'web/src/assets',
					targetPrefix: 'web/dist/assets',
					uglify: {
						mangle: true,
						compress: true
					},
					cssmin: {
						report: 'gzip',
						keepSpecialComments: 0
					},
					tasks: {
						js: ['concat', 'uglify'],
						css: ['concat', 'cssmin']
					}
				},
				files: [{
					expand: true,
					cwd: global.paths.webSrc + '/views',
					src: ['**/*.jade', '!**/partials/angular/**/*.jade'],
					ext: '.jade',
					dest: global.paths.webDist + '/views'
				}]
			}
		};

	/*HTML2JS*/
		configuration.html2js = {
			options: {
				quoteChar: '\'',
				indentString: '\t',
				singleModule: true,
				target: 'js',
				base: global.paths.webSrc + '/views/partials/angular/'
			},
			app: {
				src: [global.paths.webSrc + '/views/partials/angular/**/*.jade'],
				dest: global.paths.webSrc + '/assets/javascripts/modules/_templates/core.js'
			}
		};

	return configuration;
}