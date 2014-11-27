module.exports = ImageTasks;

/**
 * Image grunt task presets
 * available commands :
 * 	- sprite:dev
 * 	- sprite:dist
 * 	- imagemin:dist
 * 	
 * @param {Object|Grunt} grunt Grunt instance
 */
function ImageTasks(grunt) {

	var configuration = {};

	/*SPRITE*/
		configuration.sprite = {};
		configuration.sprite.dev = {
			'src': [global.paths.webSrc + '/assets/images/sprite_sources/*'],
			'destImg': global.paths.webSrc + '/assets/images/sprite.png',
			'destCSS': global.paths.webSrc + '/assets/styles/imgConsts.scss',
			'imgPath': '/images/sprite.png',
			'algorithm': 'binary-tree',
			'padding': 4,
			'engine': 'phantomjs',
			'cssFormat': 'scss',
			'algorithmOpts': { 'sort': false },
			'imgOpts': {
				'format': 'png',
				'timeout': 10000
			}
		};
		configuration.sprite.dist = {
			'src': [global.paths.webSrc + '/assets/images/sprite_sources/*'],
			'destImg': global.paths.webDist + '/assets/images/sprite.png',
			'destCSS': global.paths.webSrc + '/assets/styles/imgConsts.scss',
			'imgPath': '/images/sprite.png',
			'algorithm': 'binary-tree',
			'padding': 4,
			'engine': 'phantomjs',
			'cssFormat': 'scss',
			'algorithmOpts': { 'sort': false },
			'engineOpts': { 'imagemagick': true },
			'imgOpts': {
				'format': 'png',
				'timeout': 10000
			}
		};

	/*IMAGEMIN*/
		configuration.imagemin = {
			dist: {
				options: {
					optimizationLevel: 7
				},
				files: [{
					expand: true,
					cwd: global.paths.webDist + '/assets/images/',
					src: ['**/*.{png,jpg,gif,svg}'],
					dest: global.paths.webDist + '/assets/images/'
				}]
			}
		};

	return configuration;
}