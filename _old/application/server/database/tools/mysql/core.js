var crypto = require('crypto')
,   userProvider
,   mysqlTools = {};

mysqlTools.init = function() {
    if(!userProvider)
        userProvider = require(global.paths.server + '/database/mysql/tables/user');
}

/**
 * Hash a string with a salt
 * @param  {string} string string to hash
 * @param  {string} salt   salt used to hash the string
 * @return {string}        hashed string
 */
function encrypt(string, salt) {
    var hash = crypto.createHash('sha512');

    hash.update(string);
    hash.update(salt);

    return hash.digest('base64');
};

/**
 * Generate randomly a certain amount of bytes
 * @param  {integer}   numberOfBytes number of bytes to generate
 * @param  {Function} callback
 */
mysqlTools.generateRandomBytes = function(numberOfBytes, callback) {
    crypto.randomBytes(numberOfBytes, function(exception, bytes) {
        if(exception)
            throw exception;

        callback(bytes.toString('base64'));
    });
}

/**
 * Generate a hashed password from a string
 * @param  {string}   password password to hash
 * @param  {Function} callback
 */
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

/**
 * Check if a given password is equal to the stored one
 * @param  {string} userPassword password to compare
 * @param  {string} bddPassword  good password to compare
 * @param  {string} salt         used for hash the userPassword
 * @return {boolean}              true if passwords are equals
 */
mysqlTools.checkPassword = function(userPassword, bddPassword, salt){
    var encryptedPassword = encrypt(userPassword, salt);
    return encryptedPassword === bddPassword;
}

/**
 * Set names on a list of files
 * @param {array}   files    files to set
 * @param {Function} callback
 */
mysqlTools.setCreatorsNames = function(files, callback) {
    if(files && files.length > 0) {
        var creatorIds = [];
        // Construct an array with creator ids
        for(var i = 0; i < files.length; i++) {
            var exists = false;
            // Check if the id is already in the array
            for(var j = 0; j < creatorIds.length; j++)
                if(files[i].creatorId == creatorIds[j])
                    exists = true;
            if(!exists && files[i].creatorId !== undefined && files[i].creatorId !== null)
                creatorIds.push(files[i].creatorId);
        }
        // Get the corresponding array with creator's names inside
        if(creatorIds.length > 0)
            userProvider.get.namesByIds(creatorIds, function(error, creators) {
                if(!error && creators && (creators.length > 0 || creators.creator)) {
                    if(creators.creator) {
                        for(var i = 0; i < files.length; i++)
                            if(files[i].creatorId !== undefined && files[i].creatorId !== null)
                                files[i].creator = creators.creator;
                    }
                    else
                        for(var i = 0; i < files.length; i++)
                            for(var j = 0; j < creators.length; j++)
                                if(files[i].creatorId == creators[j].id)
                                    files[i].creator = creators[j].creator;
                }

                callback.call(this, error, files);
            })
        else
           callback.call(this, null, files);
    } else
        callback.call(this, null, files);
}

module.exports = mysqlTools;