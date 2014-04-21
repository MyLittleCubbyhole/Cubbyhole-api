var filters = {}
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token');

filters.tokenInterceptor = function(request, response, next) {
	var query = request.query
    ,   witness = false;

    var token = query.token || 0;
    token = encodeURIComponent(token);

    tokenProvider.get.byId(token, function(error, data) {
        if(data) {
            if(((data.ORIGIN && data.ORIGIN.match(/CubbyHole/i)) || data.EXPIRATIONDATE >= Date.now()) && data.TYPE == 'AUTHENTICATION')  {
                witness = true;
            } else if(data.TYPE == 'AUTHENTICATION'){
                tokenProvider.delete.byId(token, function(error, data) {
                    if(error)
                        console.log(error);
                });
            }
        }

        if(true /*witness*/)
            next();
        else {
            response.writeHead(401);
            response.write("You must be authentified to request the API");
            response.end();
        }
    });
};

module.exports = filters;