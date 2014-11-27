module.exports = function(config) {
  config.set({
	basePath: '',
	frameworks: ['jasmine'],
	files: [
		'web/src/assets/javascripts/libraries/angular/angular.min.js',
		'web/src/assets/javascripts/libraries/angular/**/*.js',
		'web/src/assets/javascripts/libraries/i18next/ng-i18next.js',
		'web/src/assets/javascripts/libraries/**/*.js',
		'web/src/assets/javascripts/modules/**/core.js',
		'web/src/assets/javascripts/modules/**/*.js',
		'web/src/assets/javascripts/spec/**/*.js',
	],
	exclude: [],
	reporters: ['progress'],
	port: 9876,
	colors: true,
	logLevel: config.LOG_INFO,
	autoWatch: false,
	browsers: ['PhantomJS'],
	singleRun: true,
	plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-phantomjs-launcher'
    ]
  });
};
