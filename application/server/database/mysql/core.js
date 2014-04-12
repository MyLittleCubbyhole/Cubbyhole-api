var db = require(global.paths.server + '/database/core').get().mysql
,	mysql = {};

mysql.query = function(query, callback) {
	var data;
	db.getConnection(function(error, self){
		try {
			if(!error) {
				self.query(query, function(error, rows) {
					if(!error) {
						data = rows.length == 1 ? rows[0] : rows;

						callback.call(this, error, data);
					}
					else
						throw 'error when querying the database'+error;

					self.release()					
				});
			}
			else
				throw 'error when connecting to the database '+error;
		}
		catch(exception) {
			callback.call('unable to execute query - '+exception);
			console.error('database: '+query+' - ',exception);
			self.release()
		}

	})

};


module.exports = mysql;

