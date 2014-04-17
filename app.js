var path    = require('path')
,   express = require('express')
,   http    = require('http')
,   app     = express()
,   server  = http.createServer(app)
,   environment = ( typeof process.argv[2] != 'undefined' ? process.argv[2] : 'dev')
,   developer = ( typeof process.argv[3] != 'undefined' ? process.argv[3] : '')
,   link = {'prod':'config-prod.json', 'dev':'config-dev.json', 'julien': 'config-julien.json', 'nicolas': 'config-nicolas.json'};

global.configFile = {};
global.configFile.env = typeof link[environment] != 'undefined' ? link[environment] : link['dev'];
global.configFile.developer = typeof link[developer] != 'undefined' ? link[developer] : '';
global.paths = { app: __dirname, server: __dirname + '/application/server' };

module.exports = { app: app, server: server };

app.configure(function(){
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
});

app.configure('production', function () {
    app.use(express.errorHandler({ dumpExceptions: false, showStack: false }));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var config = require(global.paths.server + '/config/core').init();
require(global.paths.server + '/dependencies')(server, app);

if (!module.parent)
    server.listen(config['node_config'].port, function () {
        console.log('WebService server listening on port %d in %s mode - [%s] - [%s]', this.address().port, app.settings.env, environment, developer);
    });