var file				= require('./rest/file')
,	directory			= require('./rest/directory')
,	connectMultiparty 	= require('connect-multiparty')
,	routing;
var multipartDecoder 	= connectMultiparty();

routing = function(app){

	/*just for dev*/app.get('/', function(request, response){response.render('index')})


	app.get('/api/browse', directory.get.all);
	app.get(/^\/api\/browse\/([0-9]+)$/, directory.get.byOwner);
	app.get(/^\/api\/browse\/([0-9]+)\/(\/?.+)*/, directory.get.byPath);
	app.get(/^\/api\/download\/([0-9]+)\/(\/?.+)+/, file.get.download);

	app.post(/^\/api\/browse\/([0-9]+)$/, directory.post.init);
	app.post(/^\/api\/browse\/([0-9]+)(\/?.+)*\/$/, directory.post.create);
	app.post(/^\/api\/upload\/([0-9]+)(\/?.+)*\/$/, multipartDecoder, directory.post.upload);

    app.put(/^\/api\/browse\/([0-9]+)\/(\/?.+)+/, directory.put.rename);

	app.delete(/^\/api\/browse\/([0-9]+)$/, directory.delete.byOwner);
	app.delete(/^\/api\/browse\/([0-9]+)\/(\/*.+)+/, directory.delete.byPath);
}

module.exports = routing;