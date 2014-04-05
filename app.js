var path 	= require('path')
,	express = require('express')
,	http	= require('http')
,	app		= express()
,	server	= http.createServer(app)
,	port	= process.env.PORT || 900;

global.paths = { app: __dirname, views: __dirname + '/application/client/views' };

module.exports = { app: app, server: server };

app.configure(function(){
    app.engine('ejs', require('ejs-locals'));
    app.set('views', global.paths.views);
    app.set('view engine', 'ejs');
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.cookieParser());
	app.use(express.methodOverride());
	app.use(express.static(path.join(__dirname, '/application/client/assets')));
});

app.configure('development', function(){
	this.use(express.errorHandler({ dumpExceptions: true, showStack:true }));
});

require('./application/server/dependencies')(app, server);

if(!module.parent)
	server.listen(port, function(){
		console.log('listening on ', this.address());
	});