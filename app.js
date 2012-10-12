var express = require('express'),
	request = require('request'),
	fs = require('fs'),
	im = require('imagemagick'),
	crypto = require('crypto');

var app = express(),
	image_cache_path = __dirname + '/image_cache';

app.get('/', function(req, res){
	var width = req.query.w,
		height = req.query.h,
		url = req.query.u;

	validateQueryStringParameters(width, height, url, res);
	var hashedUrl = crypto.createHash('md5').update(url).digest('hex');
	var image_path = image_cache_path + '/' + hashedUrl + '.' + getFileExtension(url);

	fs.exists(image_path, function(exists) {
		if (!exists) {
			var r = request(url)
			r.pipe(fs.createWriteStream(image_path));
			r.on('end', function() {
				sendResizedImage(image_path, width, height, res);
			});
		} else {
			sendResizedImage(image_path, width, height, res);
		}
	});
});

var getFileExtension = function(path) {
	return path.match(/.+\.([^?]+)(\?|$)/)[1];
};

var pathWithoutExtension = function(path, extension) {
	return path.substring(0, path.length - extension.length - 1);
}

var validateParameter = function(parameter, name, res) {
	if (!parameter) {
		res.send("you have to provide a '" + name + "' parameter in the query string");
		return false;
	};
	return true;
}

var validateQueryStringParameters = function(width, height, url, res) {
	var valid = true;
	
	valid = validateParameter(width, 'w', res) 
		&& validateParameter(height, 'h', res)
		&& validateParameter(url, 'u', res);

	return valid;
};

var sendResizedImage = function(image_path, width, height, res) {
	var extension = getFileExtension(image_path);
	var resized_image_path = pathWithoutExtension(image_path, extension) + "-" + width + 'x' + height + "." + extension;

	fs.exists(resized_image_path, function(exists) {
		if (!exists) {
			im.crop({
				srcPath : image_path,
				dstPath : resized_image_path,
				quality : 1,
				width : width,
				height : height
			}, function(err, stdout, stderr) {
				if (err) { throw err; };
				res.sendfile(resized_image_path);
			});			
		} else {
			res.sendfile(resized_image_path);
		};
	});
};

if (!fs.existsSync(image_cache_path)) {
	fs.mkdirSync(image_cache_path);
};

app.listen(3000);
console.log('Listening on port 3000');