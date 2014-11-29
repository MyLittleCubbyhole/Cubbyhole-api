/*Parent class cloning*/

	var Controller = require('kanto-patterns').controller.clone();

/*Factories requiring*/

	var HistoricFactory = require(__dirname + '/../factories/historic');

/*Attributes definitions*/

	Controller._name = 'Historic';

/*Overridden methods declarations*/

/*Private methods declarations*/

/*Public methods declarations*/

	Controller.get.byUser = getByUser;

module.exports = Controller;

/*Overridden methods definitions*/

/*Private methods definitions*/

/*Public methods definitions*/

	function getByUser(request, response, next) {
		
		HistoricFactory.get.byUser(request.params.userId)
			.then((historics) => historics.length > 0 ? response.json(historics) : Promise.reject(Error('No historic found')))
			.catch((error) => next(error));
	}