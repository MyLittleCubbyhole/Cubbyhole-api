var routingTools = {}
,   config = require(global.paths.server + '/config/core').get();

routingTools.addAccessControlHeaders = function(response) {

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', config['headersAccessControl'].allowMethods);
    response.setHeader('Access-Control-Allow-Headers', config['headersAccessControl'].allowHeaders);

};

module.exports = routingTools;