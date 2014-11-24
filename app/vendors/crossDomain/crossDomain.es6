var Vendor = {};

/*Public methods declarations*/

	Vendor.init = init;
	Vendor.get = get;

module.exports = Vendor;

/*Public methods definitions*/

	function init() {return Vendor;}

	function get() {
		return allowMiddleware;
	}

	function allowMiddleware(request, response, next) {

		response.setHeader('Access-Control-Allow-Origin', '*');
		response.setHeader('Access-Control-Allow-Methods', config['headers_access_control'].allow_methods);
		response.setHeader('Access-Control-Allow-Headers', config['headers_access_control'].allow_headers);

		if(request.method == 'OPTIONS')
			response.send(200);
	    else
			next();
	}