 var Dependency = function(app, server){

	require('./routing/core')(app);
	require('./socket/core')(server);

}

module.exports = Dependency;