var file = require(global.paths.server + '/routing/rest/file')
,	directory = require(global.paths.server + '/routing/rest/directory')
,	user = require(global.paths.server + '/routing/rest/user')
,	multipartDecoder = require('connect-multiparty')()
,	filters = require(global.paths.server + '/routing/filters/core')
,	routing = {};

routing.init = function(app) {

	app.get('/api/browse', filters.tokenInterceptor, directory.get.all);
	app.get(/^\/api\/browse\/([0-9]+)$/, filters.tokenInterceptor, directory.get.byOwner);
	app.get(/^\/api\/browse\/([0-9]+)\/(\/?.+)*/, filters.tokenInterceptor, directory.get.byPath);
	app.get(/^\/api\/download\/([0-9]+)\/?(\/?.+)\/$/, filters.tokenInterceptor, file.get.zip);
	app.get(/^\/api\/download\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, file.get.download);
	app.get('/api/users', filters.tokenInterceptor, user.get.all);
	app.get('/api/users/:id', filters.tokenInterceptor, user.get.byId);
	app.get('/api/activation', user.get.activateAccount);
	app.get('/api/checkToken', filters.tokenInterceptor, user.get.checkToken);
	app.get('/api/logout', user.get.logout);

	//app.post(/^\/api\/browse\/([0-9]+)$/, filters.tokenInterceptor, directory.post.init);
	app.post(/^\/api\/browse\/([0-9]+)(\/?.+)*\/$/, filters.tokenInterceptor, directory.post.create);
	//app.post(/^\/api\/upload\/([0-9]+)(\/?.+)*\/$/, multipartDecoder, directory.post.upload);
	app.post('/api/auth', user.post.authenticate);
	app.post('/api/users', user.post.create);

    app.put(/^\/api\/browse\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, directory.put.rename);

	app.delete(/^\/api\/browse\/([0-9]+)$/, filters.tokenInterceptor, directory.delete.byOwner);
	app.delete(/^\/api\/browse\/([0-9]+)\/(\/*.+)+/, filters.tokenInterceptor, directory.delete.byPath);

}



module.exports = routing;