var mongoTools = {}
,	nodeZip = new require('node-zip')
,	provider = require(global.paths.server + '/database/mongodb/collections/gridfs/file');

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
			return path.length>0 && root[id].type == 'folder' ? mongoTools.browse(path, root[id].content) : root[id];
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
			mongoTools.browseAndGetProperties(root[id].content, data, properties);
		else{
			property = {};
			for(var i in properties)
				property[properties[i]] = root[id][properties[i]];
				data.push(property);
		}
}

mongoTools.zipFolder = function(folder, callback) {
	var filesCounter = 0
	,	self = this
	,	archiver = nodeZip();

	function start() { filesCounter++; }

	function stop() {
		filesCounter--;
		if(filesCounter<=0)
			success.call(self);
	}

	function success() {
		data = archiver.generate({base64:false,compression:'DEFLATE'});
		callback.call(self, data);
	}

	mongoTools.dirtyBrowse(folder, archiver, start, stop);

}

mongoTools.dirtyBrowse = function(root, archiver, start, stop){

	for(var id in root)
		if(root[id].type == 'folder') 
			mongoTools.dirtyBrowse( root[id].content, archiver.folder(root[id].name), start, stop );

		else {
			start();
			provider.download({id : root[id].id, range : 0}, function(error, download) {
				archiver.file(download.metadata.name, download.data);
				stop();
			});
		}
}


module.exports = mongoTools;