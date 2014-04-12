var mongoTools = {};

/**
 * [RECURSION] browse directory and return wanted file/folder
 * @param  {array} path
 * @param  {json object} root
 * @param  {boolean} targetOnly
 * @return {json object | array}
 */
mongoTools.browse = function(path, root, targetOnly){
	for(var id in root)
		if(path[0] && path[0] == root[id].name){
			path = path.slice(1);
			return path.length>0 && root[id].type == 'folder' ? exports.browse(path, root[id].content) : root[id];
		}

	if(targetOnly === true && path[0] != '/')
		throw "invalid path";
	return root;
}

mongoTools.browseAndGetProperties = function(root, data, properties){
	properties 	= properties || ['name'];
	var property;

	if(!data)
		throw "second parameter must be defined";

	for(var id in root)
		if(root[id].type == 'folder')
			exports.browseAndGetProperties(root[id].content, data, properties);
		else{
			property	= {};
			for(var i in properties)
				property[properties[i]] = root[id][properties[i]];
				data.push(property);
		}
}


module.exports = mongoTools;