var filters = {}
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,   config = require(global.paths.server + '/config/core').get();

filters.tokenInterceptor = function(request, response, next) {
	var query = request.query
    ,   witness = false;

    var token = query.token || 0;
    token = encodeURIComponent(token);

    tokenProvider.get.byId(token, function(error, data) {
        if(data) {
            console.log(data);
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

module.exports = filters;