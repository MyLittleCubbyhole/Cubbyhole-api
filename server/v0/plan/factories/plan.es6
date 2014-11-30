/*Parent class cloning*/

	var MysqlFactory = require('kanto-patterns-mysql').mysqlFactory.clone();

/*Attributes definitions*/

	MysqlFactory._name = 'Plan';
	MysqlFactory._table = 'plan';

/*Model definition*/

	MysqlFactory.model.photo = '';
	MysqlFactory.model.price = 0.0;
	MysqlFactory.model.name = '';
	MysqlFactory.model.description = '';
	MysqlFactory.model.storage = 0;
	MysqlFactory.model.duration = 0;
	MysqlFactory.model.uploadBandWidth = 0;
	MysqlFactory.model.downloadBandWidth = 0;
	MysqlFactory.model.quota = 0;
	MysqlFactory.model.available = 0;

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	MysqlFactory.get.all = getAll;
	MysqlFactory.create = create;
	MysqlFactory.update.byId = updateById;
	MysqlFactory.update.available = updateAvailable;

module.exports = MysqlFactory;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getAll() {
		return this.query('select * from `plan` where `available`=1;');
	}

	function create(model) {

		var query = 'INSERT INTO `plan` (`photo`,`price`,`name`,`description`,`storage`,`duration`,`uploadBandWidth`,`downloadBandWidth`,`quota`,`available`)\
				VALUES ("' + model.photo + '",\
						' + parseFloat(model.price, 10) + ',\
						"' + model.name + '",\
						"' + model.description + '",\
						' + parseInt(model.storage, 10) + ',\
						' + parseInt(model.duration, 10) + ',\
						' + parseInt(model.uploadBandWidth, 10) + ',\
						' + parseInt(model.downloadBandWidth,10) + ',\
						' + parseInt(model.quota, 10) + ',\
						1);';

		return this.query(query);
	}

	function updateById(id, model) {
		var query = 'UPDATE `plan`\
			SET `photo`="' + model.photo + '",\
				`price`=' + parseFloat(model.price, 10) + ',\
				`name`="' + model.name + '",\
				`description`="' + model.description + '",\
				`storage`=' + parseInt(model.storage, 10) + ',\
				`duration`=' + parseInt(model.duration, 10) + ',\
				`uploadBandWidth`=' + parseInt(model.uploadBandWidth, 10) + ',\
				`downloadBandWidth`=' + parseInt(model.downloadBandWidth,10) + ',\
				`quota`=' + parseInt(model.quota, 10) + '\
			WHERE `id`=' + parseInt(id, 10) + ';';

		return this.query(query);
	}

	function updateAvailable(id, available) {
		return this.query('update `plan` set `available`=' + ( !!available ? 1 : 0 ) + ' where `id`=' + parseInt(id, 10) + ';');
	}