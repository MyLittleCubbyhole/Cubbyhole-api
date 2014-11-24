var Path = require('path');

module.exports = WatchTasks;

/**
 * Common grunt task presets
 * available commands :
 * 	- watch:app
 * 	
 * @param {Object|Grunt} grunt Grunt instance
 */
function WatchTasks(grunt) {

	var configuration = {};

	configuration.watch = {
		'app': {
			files: ['app/**/*.es6', 'server/**/*.es6', 'web/src/**/*.es6', 'web/src/assets/styles/**/*.scss', 'web/src/views/partials/angular/**/*.jade'],
			tasks: [],
			options: {
				interrupt: true,
				spawn: false
			}
		}
	};

	configuration.watcherParameters = {
		action: '',
		filePath: ''
	};

	grunt.event.on('watch', function(action, filePath) {
		grunt.config('watcherParameters.action', action);
		grunt.config('watcherParameters.filePath', filePath);
		grunt.task.run('watcherExecute');
	});

	grunt.registerTask('watcherExecute', 'Execute tasks from the watcher. Do not launch manually.', function() {

		var action = grunt.config('watcherParameters.action'),
		    filePath = grunt.config('watcherParameters.filePath'),
		    extension = Path.extname(filePath),
		    filePathWithoutExtension = Path.normalize(Path.dirname(filePath) + '/' + Path.basename(filePath, extension));

		grunt.config('6to5.watch.files.0.src', 'temp.es6');
		grunt.config('johto_require.watch.files.0.src', 'temp.js');
		grunt.config('add_comment.watch.files.0.src', 'temp.js');
		grunt.config('add_comment.watch.options.comments.1', new Date());
		grunt.config('clean.watch.files.0.src', 'temp.js');

		if(action === 'added' || action === 'changed') {
			if(extension === '.es6') {
				grunt.config('6to5.watch.files.0.src', filePathWithoutExtension + '.es6');
				grunt.config('johto_require.watch.files.0.src', filePathWithoutExtension + '.js');
				grunt.config('add_comment.watch.files.0.src', filePathWithoutExtension + '.js');
				grunt.task.run(['6to5:watch', 'johto_require:watch', 'add_comment:watch']);
			}
		}
		if(action === 'deleted') {
			if(extension === '.es6') {
				grunt.config('clean.watch.files.0.src', [filePathWithoutExtension + '.js.map', filePathWithoutExtension + '.js']);
				grunt.task.run('clean:watch');
			}
		}
		if(extension === '.scss')
			grunt.task.run(['sass:app']);
		if(extension === '.jade')
			grunt.task.run(['html2js:app']);
	});

	return configuration;
}