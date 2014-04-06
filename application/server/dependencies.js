var dependencies;

dependencies = function(server, app) {

	require(global.paths.server + '/database/core').init();
	require(global.paths.server + '/routing/core').init(app);
	require(global.paths.server + '/websockets/core').init(server);

}

module.exports = dependencies;