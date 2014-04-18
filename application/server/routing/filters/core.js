var filters = {},
    tokenProvider = require(global.paths.server + '/database/mysql/tables/token');

filters.tokenInterceptor = function(request, response, next) {
	var query = request.query
    ,   witness = false;

    var token = query.token || 0;

    tokenProvider.get.byId(token, function(error, data) {
        if(data) {
            if((data.ORIGIN && data.ORIGIN.match(/CubbyHole/i)) || data.EXPIRATIONDATE >= Date.now()) {
                witness = true;
            } else {
                tokenProvider.delete.byId(token, function(error, data) {});
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

module.exports = filters;