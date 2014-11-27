var Path = require('path');

module.exports = I18nTasks;

/**
 * I18n grunt task presets
 * available commands :
 * 	- johto_i18n_parse:app
 * 	
 * @param {Object|Grunt} grunt Grunt instance
 */
function I18nTasks(grunt) {

	var configuration = {},
		config = global.config;

	if(config && config.i18n) {
		if(config.i18n.datastores && config.i18n.datastores.filesystem)
			config.i18n.datastores.filesystem.localesFolder = Path.normalize(global.paths.app + config.i18n.datastores.filesystem.localesFolder);

		configuration.johto_i18n_parse = {
			app: {
				options: {
					defaultNamespace: config.i18n.i18next.ns.defaultNs,
					functions: ['t'],
					locales: config.i18n.locales,
					namespaceSeparator: config.i18n.i18next.nsseparator,
					keySeparator: config.i18n.i18next.keyseparator,
					datastores: config.i18n.datastores,
					mongodb: config.databases.mongodb
				},
				files: [
					{
						expand: true,
						cwd: global.paths.webSrc,
						src: ['**/*.jade']
					}
				]
			}
		};
	}

	return configuration;
}