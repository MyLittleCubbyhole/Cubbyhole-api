var file = require(global.paths.server + '/routing/rest/file')
,	directory = require(global.paths.server + '/routing/rest/directory')
,	user = require(global.paths.server + '/routing/rest/user')
,	plan = require(global.paths.server + '/routing/rest/plan')
,	multipartDecoder = require('connect-multiparty')()
,	filters = require(global.paths.server + '/routing/filters/core')
,	routing = {};

routing.init = function(app) {

	app.get(/^\/api\/browse\/([0-9]+)$/, filters.tokenInterceptor, filters.rightInterceptor, directory.get.byOwner);
	app.get(/^\/api\/browse\/([0-9]+)\/size$/, filters.tokenInterceptor, filters.rightInterceptor, directory.get.size);
	app.get(/^\/api\/browse\/([0-9]+)\/(\/?.+)*/, filters.tokenInterceptor,filters.rightInterceptor, directory.get.byPath);
	app.get(/^\/api\/download\/([0-9]+)\/$/, filters.tokenInterceptor, filters.rightInterceptor, file.get.zip);
	app.get(/^\/api\/download\/([0-9]+)\/?(\/?.+)\/$/, filters.tokenInterceptor, filters.rightInterceptor, file.get.zip);
	app.get(/^\/api\/download\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, filters.rightInterceptor, file.get.download);
	app.get(/^\/api\/share\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, filters.rightInterceptor, file.get.share);
	app.get(/^\/api\/unshare\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, filters.rightInterceptor, file.get.unshare);
	app.get(/^\/api\/download\/shared\/(.+)+/, file.get.sharedPreview);
	app.get(/^\/api\/shared\/(.+)+/, file.get.shared);
	app.get('/api/users', filters.tokenInterceptor, filters.adminInterceptor, user.get.all);
	app.get(/^\/api\/users\/shared\/(\/?.+)+\/$/, filters.tokenInterceptor, user.get.usersBySharing);
	app.get('/api/users/:email', filters.tokenInterceptor, user.get.byEmail);
	app.get('/api/users/:id/plan', filters.tokenInterceptor, user.get.currentPlan);
	app.get('/api/users/:id/quota', filters.tokenInterceptor, user.get.usedQuota);
	app.get('/api/users/:id/historic', filters.tokenInterceptor, user.get.historic);
	app.get('/api/activation', user.get.activateAccount);
	app.get('/api/checkToken', filters.tokenInterceptor, user.get.checkToken);
	app.get('/api/checkAdminToken', filters.tokenInterceptor, filters.adminInterceptor, user.get.checkToken);
	app.get('/api/logout', user.get.logout);
	app.get('/api/plans', plan.get.all);
	app.get('/api/plans/images', plan.get.images);

	app.post(/^\/api\/download\/([0-9]+)\/$/, filters.tokenInterceptor, filters.rightInterceptor, file.post.zip);
	app.post(/^\/api\/share\/([0-9]+)(\/?.+)*\/$/, filters.tokenInterceptor, filters.rightInterceptor, directory.post.share);
	app.post(/^\/api\/unshare\/([0-9]+)(\/?.+)*\/$/, filters.tokenInterceptor, filters.rightInterceptor, directory.post.unshare);
	app.post(/^\/api\/browse\/([0-9]+)(\/?.+)*\/$/, filters.tokenInterceptor, filters.rightInterceptor, directory.post.create);
	app.post(/^\/api\/copy\/([0-9]+)(\/?.+)*$/, filters.tokenInterceptor, filters.rightInterceptor, directory.post.copy);
	app.post(/^\/api\/move\/([0-9]+)(\/?.+)*$/, filters.tokenInterceptor, filters.rightInterceptor, directory.post.move);
	app.post(/^\/api\/upload\/([0-9]+)(\/?.+)*\/$/, multipartDecoder, filters.tokenInterceptor, filters.rightInterceptor, filters.mobileInterceptor, file.post.upload);
	app.post('/api/auth', user.post.authenticate);
	app.post('/api/users', multipartDecoder, user.post.create);
	app.post('/api/plans', filters.tokenInterceptor, filters.adminInterceptor, plan.post.create);
	app.post('/api/users/:userId/plans/:planId', filters.tokenInterceptor, user.post.subscribe);
	app.post('/api/paypalNotify', user.post.paypalNotify);

    app.put(/^\/api\/browse\/([0-9]+)\/(\/?.+)+/, filters.tokenInterceptor, filters.rightInterceptor, directory.put.rename);
    app.put('/api/users/:id', multipartDecoder, filters.tokenInterceptor, user.put.byId);
    app.put('/api/plans/:id', filters.tokenInterceptor, filters.adminInterceptor, plan.put.byId);
	app.put('/api/users/:id/promote', filters.tokenInterceptor, filters.adminInterceptor, user.put.promote);
	app.put('/api/users/:id/demote', filters.tokenInterceptor, filters.adminInterceptor, user.put.demote);

	app.delete(/^\/api\/browse\/([0-9]+)$/, filters.tokenInterceptor, filters.rightInterceptor, directory.delete.byOwner);
	app.delete(/^\/api\/browse\/([0-9]+)\/(\/*.+)+/, filters.tokenInterceptor, filters.rightInterceptor, directory.delete.byPath);
	app.delete('/api/plans/:id', filters.tokenInterceptor, filters.adminInterceptor, plan.delete.byId);

}



module.exports = routing;