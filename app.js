var express = require('express'),
	request = require('request'),
	fs = require('fs'),
	crypto = require('crypto');

var app = express(),
	image_cache_path = __dirname + '/image_cache';

app.get('/', function(req, res){
	var width = req.query.w,
		height = req.query.h,
		url = req.query.u;

	validateQueryStringParameters(width, height, url, res);
	var hashedUrl = crypto.createHash('md5').update(url).digest('hex');
	var image_path = image_cache_path + '/' + hashedUrl;

	fs.exists(image_path, function(exists) {
		if (!exists) {
			var r = request(url)
			r.pipe(fs.createWriteStream(image_path));
			r.on('end', function() {
				sendResizedImage(image_path, res);
			});
		} else {
			sendResizedImage(image_path, res);
		}
	});
});

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

var sendResizedImage = function(image_path, res) {
	res.send("you should've received the resized image now, but i still need to write that part... check back soon ;)");
};

if (!fs.existsSync(image_cache_path)) {
	fs.mkdirSync(image_cache_path);
};

app.listen(3000);
console.log('Listening on port 3000');