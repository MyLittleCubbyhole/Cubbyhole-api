var file = require(global.paths.server + '/routing/rest/file')
,	directory = require(global.paths.server + '/routing/rest/directory')
,	user = require(global.paths.server + '/routing/rest/user')
,	plan = require(global.paths.server + '/routing/rest/plan')
,	multipartDecoder = require('connect-multiparty')()
,	filters = require(global.paths.server + '/routing/filters/core')
,	routing = {};

routing.init = function(app) {

	app.get('/api/browse', filters.tokenInterceptor, directory.get.all);
	app.get(/^\/api\/browse\/([0-9]+)$/, filters.tokenInterceptor, directory.get.byOwner);
	app.get(/^\/api\/browse\/([0-9]+)\/(\/?.+)*/, filters.tokenInterceptor, directory.get.byPath);
	app.get(/^\/api\/download\/([0-9]+)\/$/, filters.tokenInterceptor, file.get.zip);
	app.get(/^\/api\/download\/([0-9]+)\/?(\/?.+)\/$/, filters.tokenInterceptor, file.get.zip);
	app.get(/^\/api\/download\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, file.get.download);
	app.get(/^\/api\/share\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, file.get.share);
	app.get(/^\/api\/unshare\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, file.get.unshare);
	app.get(/^\/api\/download\/shared\/(.+)+/, file.get.sharedPreview);
	app.get(/^\/api\/shared\/(.+)+/, file.get.shared);
	app.get('/api/users', filters.tokenInterceptor, user.get.all);
	app.get('/api/users/:id', filters.tokenInterceptor, user.get.byId);
	app.get('/api/activation', user.get.activateAccount);
	app.get('/api/checkToken', filters.tokenInterceptor, user.get.checkToken);
	app.get('/api/logout', user.get.logout);
	app.get('/api/plans', plan.get.all);

	//app.post(/^\/api\/browse\/([0-9]+)$/, filters.tokenInterceptor, directory.post.init);
	app.post(/^\/api\/download\/([0-9]+)\/$/, filters.tokenInterceptor, file.post.zip);
	app.post(/^\/api\/share\/([0-9]+)(\/?.+)*\/$/, filters.tokenInterceptor, directory.post.share);
	app.post(/^\/api\/browse\/([0-9]+)(\/?.+)*\/$/, filters.tokenInterceptor, directory.post.create);
	app.post(/^\/api\/copy\/([0-9]+)(\/?.+)*$/, filters.tokenInterceptor, directory.post.copy);
	app.post(/^\/api\/move\/([0-9]+)(\/?.+)*$/, filters.tokenInterceptor, directory.post.move);
	//app.post(/^\/api\/upload\/([0-9]+)(\/?.+)*\/$/, multipartDecoder, directory.post.upload);
	app.post('/api/auth', user.post.authenticate);
	app.post('/api/users', user.post.create);
	app.post('/api/plans', filters.tokenInterceptor, plan.post.create); // TODO ajouter filter pour check si admin

    app.put(/^\/api\/browse\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, directory.put.rename);
    app.put('/api/users/:id', filters.tokenInterceptor, user.put.updateInformations);
    app.get('/api/plans/:id', plan.put.updateInformations);

	app.delete(/^\/api\/browse\/([0-9]+)$/, filters.tokenInterceptor, directory.delete.byOwner);
	app.delete(/^\/api\/browse\/([0-9]+)\/(\/*.+)+/, filters.tokenInterceptor, directory.delete.byPath);

}



module.exports = routing;