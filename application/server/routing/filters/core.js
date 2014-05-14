var filters = {}
,   sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings')
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
            response.write('You must be authentified to request the API');
            response.end();
        }
    });
};

filters.rightInterceptor = function(request, response, next) {
    var ownerId = request.params[0]
    ,   userId = request.userId
    ,   fullPath = ownerId + '/' + (request.params[1] ? (request.params[1][0] == '/' ? request.params[1].substring(1) : request.params[1] ) : '') ;

    if(ownerId == 1) {
        request.right = 'R';
        request.owner = false;
        next();
    }
    else {
        if(ownerId == userId) {
            request.right = 'W';
            request.owner = true;
            next();
        }
        else {
            fullPath = fullPath.slice(-1) != '/' || !request.params[1] ? fullPath :fullPath.slice(0, -1);
            sharingProvider.checkRight({fullPath: fullPath, targetId: userId}, function(error, data) {
                if(!error && data) {
                    request.right = data.right;
                    request.owner = false;
                    next();
                }
                else {
                    response.writeHead(401);
                    response.write('forbiden resource');
                    response.end();
                }
            })
        }
    }
}

filters.adminInterceptor = function(request, response, next) {
    userProvider.get.byId(request.userId, function(error, user) {
        if(!error && user && user.roleid == 2)
            next();
        else {
            response.writeHead(401);
            response.write('You must be authentified as an administrator to make this request');
            response.end();
        }
    })
}

module.exports = filters;