var filters = {}
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,   userProvider = require(global.paths.server + '/database/mysql/tables/user');

filters.tokenInterceptor = function(request, response, next) {
	var query = request.query
    ,   witness = false;

    var token = query.token || 0;
    token = encodeURIComponent(token);

    tokenProvider.isValidForAuthentication(token, function(error, userId) {
        if(!error && userId) {
            request.userId = userId;
            next();
        } else {
            response.writeHead(401);
            response.write("You must be authentified to request the API");
            response.end();
        }
    });
};

filters.adminInterceptor = function(request, response, next) {
    userProvider.get.byId(request.userId, function(error, user) {
        if(!error && user && user.roleid == 2)
            next();
        else {
            response.writeHead(401);
            response.write("You must be authentified as an administrator to make this request");
            response.end();
        }
    })
}

module.exports = filters;