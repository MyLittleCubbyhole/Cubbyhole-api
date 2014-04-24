var crypto = require('crypto')
,   mysqlTools = {};

function encrypt(string, salt) {
    var hash = crypto.createHash('sha512');

    console.log(string, salt, hash);
    hash.update(string);
    hash.update(salt);

    return hash.digest('base64');
};

mysqlTools.generateRandomBytes = function(numberOfBytes, callback) {
    crypto.randomBytes(numberOfBytes, function(exception, bytes) {
        if(exception)
            throw exception;

        console.log(bytes.toString('base64'));
        console.log('------')
        console.log(bytes);
        console.log('passage');
        callback(bytes.toString('base64'));
    });
}

mysqlTools.generatePassword = function(password, callback){
    var data = {};

    if(!password || password.length<8)
        throw 'invalid password - password length must be greater than 8';

    console.log('(-)')
    mysqlTools.generateRandomBytes(256, function(salt) {
        data.salt = salt;
        console.log(salt)

        data.password = encrypt(password, data.salt);

        callback.call(this, data);
    });
}

mysqlTools.checkPassword = function(userPassword, bddPassword, salt){
    var encryptedPassword = encrypt(userPassword, salt);
    return encryptedPassword === bddPassword;
}

module.exports = mysqlTools;