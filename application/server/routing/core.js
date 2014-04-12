var file = require(global.paths.server + '/routing/rest/file')
,	directory = require(global.paths.server + '/routing/rest/directory')
,	user = require(global.paths.server + '/routing/rest/user')
,	multipartDecoder = require('connect-multiparty')()
,	routing = {};

routing.init = function(app) {

	app.get('/api/browse', directory.get.all);
	app.get(/^\/api\/browse\/([0-9]+)$/, directory.get.byOwner);
	app.get(/^\/api\/browse\/([0-9]+)\/(\/?.+)*/, directory.get.byPath);
	app.get(/^\/api\/download\/([0-9]+)\/(\/?.+)+/, file.get.download);
	app.get('/api/users', user.get.all);
	app.get('/api/users/:id', user.get.byId);

	app.post(/^\/api\/browse\/([0-9]+)$/, directory.post.init);
	app.post(/^\/api\/browse\/([0-9]+)(\/?.+)*\/$/, directory.post.create);
	app.post(/^\/api\/upload\/([0-9]+)(\/?.+)*\/$/, multipartDecoder, directory.post.upload);

    app.put(/^\/api\/browse\/([0-9]+)\/(\/?.+)+/, directory.put.rename);

	app.delete(/^\/api\/browse\/([0-9]+)$/, directory.delete.byOwner);
	app.delete(/^\/api\/browse\/([0-9]+)\/(\/*.+)+/, directory.delete.byPath);
}



module.exports = routing;