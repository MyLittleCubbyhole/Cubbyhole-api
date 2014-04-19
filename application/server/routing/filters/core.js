var filters = {}
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,   config = require(global.paths.server + '/config/core').get();;

filters.tokenInterceptor = function(request, response, next) {
	var query = request.query
    ,   witness = true;

    var token = query.token || 0;

    tokenProvider.get.byId(token, function(error, data) {
        if(data) {
            if((data.ORIGIN && data.ORIGIN.match(/CubbyHole/i)) || data.EXPIRATIONDATE >= Date.now()) {
                witness = true;
            } else {
                tokenProvider.delete.byId(token, function(error, data) {
                    if(error)
                        console.log(error);
                });
            }
        }

        if(witness)
            next();
        else {

            response.writeHead(401, {});
            response.end();
        }
    });
};

filters.headersInterceptor = function(request, response, next) {

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', config['headersAccessControl'].allowMethods);
    response.setHeader('Access-Control-Allow-Headers', config['headersAccessControl'].allowHeaders);

    next();

};

module.exports = filters;