/*Parent class cloning*/

	var Service = require('kanto-patterns').service.clone();

/*Services requiring*/

	var Security = require('kanto-tools-security');

/*Factories requiring*/

	var TokenFactory = require(__dirname + '/../factories/token'),
		UserFactory = require(__dirname + '/../../user/factories/user');

/*Managers requiring*/

	var TokenManager = require(__dirname + '/../managers/token');

/*Attributes definitions*/

	Service._name = 'Token';

/*Overridden methods declarations*/

/*Private methods declarations*/

	Service._verifyOrigin = _verifyOrigin;
	Service._verifyTTL = _verifyTTL;
	Service._isAValidAuthToken = _isAValidAuthToken;

/*Public methods declarations*/

	Service.verifyToken = verifyToken;
	Service.isAdminToken = isAdminToken;
	Service.generate = generate;
	Service.uriEncode = uriEncode;
	Service.uriDecode = uriDecode;

module.exports = Service;

/*Overridden methods definitions*/

/*Private methods definitions*/

	function _verifyTTL(ttl = new Date()) {
		return ttl <= new Date();
	}

	function _verifyOrigin(origin = '') {
		return origin.match(/CubbyHole/i);
	}

	function _isAValidAuthToken(tokenId) {
		return TokenManager.get.withUserById(tokenId)
			.then((tokens) => {
				if(tokens.length === 0)
					throw Error('Token not found');

				var token = tokens[0];
				if( (!this._verifyOrigin(token.origin) && this._verifyTTL(token.expirationDate)) || token.type !== 'AUTHENTICATION') {
					TokenFactory.delete.byId(tokenId);
					throw Error('Bad token');
				}

				return token;
			});
	}

/*Public methods definitions*/

	function verifyToken(token = '==') {

		token = encodeURIComponent(token);

		return this._isAValidAuthToken(token).
			then((tokenFetched) => {
				if(tokenFetched.userId)
					return {
						userId: tokenFetched.userId,
						userName: tokenFetched.firstname + ' ' + tokenFetched.lastname,
						origin: tokenFetched.origin
					};
				else
					throw Error('unauthorized token');
			});
	}

	function isAdminToken(userId = -1) {
		return UserFactory.get.byId(userId)
			.then((users) => {
				if(users.length === 0 || users[0].roleId !== 2)
					throw Error('unauthorized user');
			});
	}

	function generate(data = new Date().getTime()) {
		return this.uriEncode(Security.aesEncryption(JSON.stringify(data), global.parameters.apiKey));
	}

	function uriEncode(accessToken) {
		return encodeURIComponent(accessToken);
	}

	function uriDecode(accessToken) {
		return decodeURIComponent(accessToken);
	}