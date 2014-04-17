var filters = {};

filters.tokenInterceptor = function(request, response, next) {
	var query = request.query
	,	witness = true;


	/** Do something SALOPE **/


	if(witness)
		next();
	else
		console.error('invalid access token');
} 

module.exports = filters;