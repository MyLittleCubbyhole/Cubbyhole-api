var filters = {}
,   sharingProvider = require(global.paths.server + '/database/mongodb/collections/fs/sharings')
,   tokenProvider = require(global.paths.server + '/database/mysql/tables/token')
,   userProvider = require(global.paths.server + '/database/mysql/tables/user');

/**
 * Filter to check if a given token is valid for authentication
 * @param  {object}   request
 * @param  {object}   response
 * @param  {Function} next
 */
filters.tokenInterceptor = function(request, response, next) {
	var query = request.query
    ,   witness = false;

    var token = query.token || 0;
    token = encodeURIComponent(token);
    if(request.method == 'GET' && (request.url.substring(0, 30).indexOf('/api/download/1/admin') > -1 || request.url.substring(0, 30).indexOf('/api/download/1/userPhotos') > -1))
        next();
    else
        tokenProvider.isValidForAuthentication(token, function(error, data) {
            if(!error && data && data.userid) {
                request.userId = data.userid;
                request.userName = data.firstname + ' ' + data.lastname;
                request.origin = data.origin;
                next();
            } else {
                response.writeHead(401);
                response.write('You must be authentified to request the API');
                response.end();
            }
        });
};

/**
 * Filter to check the rights of an user on the requested element
 * @param  {object}   request
 * @param  {object}   response
 * @param  {Function} next
 */
filters.rightInterceptor = function(request, response, next) {
    var ownerId = request.params[0]
    ,   userId = request.userId
    ,   fullPath = ownerId + '/' + (request.params[1] ? (request.params[1][0] == '/' ? request.params[1].substring(1) : request.params[1] ) : '') ;

    request.ownerId = parseInt(ownerId, 10);

    if(ownerId == 1 && userId != 1) {
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
                    request.sharingId = data._id;
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

/**
 * Check if the user who made the request is an administrator
 * @param  {object}   request
 * @param  {object}   response
 * @param  {Function} next
 */
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

/**
 * Check if the request was made from a mobile device
 * @param  {object}   request
 * @param  {object}   response
 * @param  {Function} next
 */
filters.mobileInterceptor = function(request, response, next) {
    if(request.origin.match(/CubbyHole/i))
        next();
    else {
        response.writeHead(401);
        response.write('This method is only available on mobile');
        response.end();
    }
}

module.exports = filters;