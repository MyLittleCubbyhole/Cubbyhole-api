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

mongoTools.format = function(rows) {

	var formatedObject = []
	,	path = []
	,	witness = false
	,	index = -1;

	for(var i = 0; i<rows.length; i++) {
		path = rows[i].path.split('/');
		path.splice(0,1);
		path.splice(-1, 1);

		var current = formatedObject;
		if(path.length>0)
			for(var j = 0; j<path.length; j++) {
				witness = false;
				for(var k = 0; k<current.length; k++)
					if(current[k].name == path[j]) {
						witness = true;
						index = k;
						break;
					}

				if(!witness)
					index = current.push({
						name: path[j],
						content: []
					}) - 1;
				current = current[index].content;
			}

		var item = rows[i];
		witness = false;
		for(var j = 0; j<current.length; j++)
			if(current[j].name == item.name) {
				witness = true;
				index = j;
				break;
			}

		if(!witness) {
			if(rows[i].type == 'folder')
				item.content = [];
			current.push(item)
		}
		else 
			for(var attribute in item) 
				if(attribute != 'content')
				current[index][attribute] = item[attribute];
	}

	return formatedObject;

}

mongoTools.zipFolder = function(folder, callback) {
	var filesCounter = 0
	,	self = this
	,	archiver = nodeZip();

	archiver.file('read.me', 'powered by cubbyhole, \n cordialement, \n le trou du cube');

	function start() { filesCounter++; }

	function stop() {
		filesCounter--;
		if(filesCounter<=0)
			success.call(self);
	}

	function success() {
		var zipFile = {name: folder.name, data: null};
		zipFile.data = archiver.generate({base64:false,compression:'DEFLATE'});
		callback.call(self, zipFile);
	}

	mongoTools.dirtyBrowse(folder.data, archiver, start, stop);

}

mongoTools.dirtyBrowse = function(root, archiver, start, stop){

	start()
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
	stop();
}


module.exports = mongoTools;