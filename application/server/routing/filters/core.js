var filters = {},
    tokenProvider = require(global.paths.server + '/database/mysql/tables/token');

filters.tokenInterceptor = function(request, response, next) {
	var query = request.query
    ,   witness = true;

    var token = parseInt(query.token, 10) || 0;

    tokenProvider.get.byId(token, function(error, data) {
        if(data) {
            if(data.EXPIRATIONDATE >= Date.now()) {
                witness = true;
            }
        }

        if(witness)
            next();
        else {
            response.writeHead(401, {});
            response.end();
        }
    });
}

module.exports = filters;