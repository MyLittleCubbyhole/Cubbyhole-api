var crypto = require('crypto')
,   userProvider
,   mysqlTools = {};

mysqlTools.init = function() {
    if(!userProvider)
        userProvider = require(global.paths.server + '/database/mysql/tables/user');
}

function encrypt(string, salt) {
    var hash = crypto.createHash('sha512');

    hash.update(string);
    hash.update(salt);

    return hash.digest('base64');
};

mysqlTools.generateRandomBytes = function(numberOfBytes, callback) {
    crypto.randomBytes(numberOfBytes, function(exception, bytes) {
        if(exception)
            throw exception;

        callback(bytes.toString('base64'));
    });
}

mysqlTools.generatePassword = function(password, callback){
    var data = {};

    if(!password || password.length<8)
        console.warn('invalid password - password length must be greater than 8');

    mysqlTools.generateRandomBytes(256, function(salt) {
        data.salt = salt;

        data.password = encrypt(password, data.salt);

        callback.call(this, data);
    });
}

mysqlTools.checkPassword = function(userPassword, bddPassword, salt){
    var encryptedPassword = encrypt(userPassword, salt);
    return encryptedPassword === bddPassword;
}

mysqlTools.setOwnersNames = function(files, callback) {
    if(files && files.length > 0) {
        var ownerIds = [];
        // Construct an array with owner ids
        for(var i = 0; i < files.length; i++) {
            var exists = false;
            // Check if the id is already in the array
            for(var j = 0; j < ownerIds.length; j++)
                if(files[i].ownerId == ownerIds[j])
                    exists = true
            if(!exists)
                ownerIds.push(files[i].ownerId);
        }
        // Get the corresponding array with owner's names inside
        userProvider.get.namesByIds(ownerIds, function(error, owners) {
            if(!error && owners && (owners.length > 0 || owners.owner)) {
                if(owners.owner)
                    for(var i = 0; i < files.length; i++)
                        files[i].owner = owners.owner;
                else
                    for(var i = 0; i < files.length; i++)
                        for(var j = 0; j < owners.length; j++)
                            if(files[i].ownerId == ownerIds[j])
                                files[i].owner = owners[j].owner;
            }

            callback.call(this, error, files);
        })
    } else {
        callback.call(this, null, files);
    }
}

module.exports = mysqlTools;