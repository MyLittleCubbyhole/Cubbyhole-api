var crypto = require('crypto')
,	mysqlTools = {};

function encrypt(string, salt) {
	var hash = crypto.createHash('sha512');

	hash.update(string);
	hash.update(salt);

	return hash.digest('base64');
};

mysqlTools.generatePassword = function(password, callback){
	var data = {};

	if(!password || password.length<=8)
		throw 'invalid password - password length must be greater than 8';

	crypto.randomBytes(256, function(exception, salt) {
		if(exception)
			throw exception;

		data.salt = salt.toString('base64');

		data.password = encrypt(password, data.salt);
		
		callback.call(this, data);
	});
}

mysqlTools.checkPassword = function(userPassword, bddPassword, salt){
	var encryptedPassword = encrypt(userPassword, salt);
	return encryptedPassword === bddPassword;
}

module.exports = mysqlTools;