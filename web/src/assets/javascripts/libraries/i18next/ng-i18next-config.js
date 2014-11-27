angular.module('jm.i18next').config(['$i18nextProvider', function ($i18nextProvider) {
    $i18nextProvider.options = window.__localizationConfig || {
		'ns': {
			'defaultNs': 'app',
			'namespaces': ['app', 'app2']
		},
		'fallbackLng': 'en',
		'nsseparator': ':',
		'keyseparator': '.',
		'detectLngFromPath': 0,
		'dynamicLoad': true,
		'resGetPath': '/locales/resources.json?lng=__lng__&ns=__ns__',
		'useCookie': false,
		'fallbackOnNull': true,
		'ignoreRoutes': ['images/', 'styles/', 'javascripts/', 'fonts/'],
		'sendMissing': false,
		'languages': ['en', 'en-US', 'fr', 'fr-FR']
	};
}]);