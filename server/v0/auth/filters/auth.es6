/*Parent class cloning*/

	var Filter = require('kanto-patterns').filter.clone();

/*Services requiring*/

	var TokenService = require(__dirname + '/../services/token');

/*Attributes definitions*/

	Filter._name = 'Auth';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Filter.verifyToken = verifyToken;
	Filter.verifyToken = verifyToken;
	Filter.verifyToken = verifyToken;

module.exports = Filter;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function verifyToken(request, response, next) {
		
		var token = TokenService.uriEncode(request.query.token || ''),
			uriPart = request.url.substring(0, 30);

		if(~uriPart.indexOf('/api/download/1/admin') || ~uriPart.indexOf('/api/download/1/userPhotos'))//public account
			next();
		else
			TokenService.verifyToken(token)
				.then((tokenInfos) => {
					request.userId = tokenInfos.userId;
					request.userName = tokenInfos.userName;
					request.origin = tokenInfos.origin;
					next();
				})
				.catch(() => response.status(401).json({error: 'You must be authentified to request the api'}));


	}