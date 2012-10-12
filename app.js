var express = require('express'),
	request = require('request'),
	fs = require('fs'),
	im = require('imagemagick'),
	touch = require('touch'),
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
	var resized_image_path = getResizedImagePath(image_path, width, height);

	var sendFile = function() {
		touch(resized_image_path);
		res.sendfile(resized_image_path);
	};

	// if we have still have the resized image locally, send that to the client
	fs.exists(resized_image_path, function(resized_exists) {
		if (resized_exists) {
			sendFile();
			return;
		};

		// we don't have the resized image... check whether we have the original
		fs.exists(image_path, function(exists) {
			var resizeAndSend = function() {
				resizeImage(image_path, width, height, resized_image_path, function() {
					sendFile();
				});
			};

			if (exists) {
				resizeAndSend();
			} else {
				var r = request(url)
				r.pipe(fs.createWriteStream(image_path));
				r.on('end', function() {
					resizeAndSend();
				});
			}
		});
	});
});

var getFileExtension = function(path) {
	return path.match(/.+\.([^?]+)(\?|$)/)[1];
};

var pathWithoutExtension = function(path, extension) {
	return path.substring(0, path.length - extension.length - 1);
};

var getResizedImagePath = function(image_path, width, height) {
	var extension = getFileExtension(image_path);
	return pathWithoutExtension(image_path, extension) + '-' + width + 'x' + height + '.' + extension; 
};

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

var resizeImage = function(image_path, width, height, resized_image_path, callback) {
	touch(image_path);
	im.crop({
		srcPath : image_path,
		dstPath : resized_image_path,
		quality : 1,
		width : width,
		height : height
	}, function(err, stdout, stderr) {
		if (err) { throw err; };
		callback();
	});
};

if (!fs.existsSync(image_cache_path)) {
	fs.mkdirSync(image_cache_path);
};

var clean_cached_images = function() {
	var images_ordered_descending_by_mod_date = fs.readdirSync(image_cache_path)
    .map(function(v) { 
        return { 
        	name: v,
          time: fs.statSync(image_cache_path + '/' + v).mtime.getTime()
        }; 
     })
    .sort(function(a, b) { return b.time - a.time; })
    .map(function(v) { return v.name; });

  if (images_ordered_descending_by_mod_date.length > 10) {
  	var images_to_remove = images_ordered_descending_by_mod_date.slice(10);
  	for (var i = images_to_remove.length - 1; i >= 0; i--) {
  		fs.unlink(image_cache_path + '/' + images_to_remove[i]);
  	};
  };
};

setInterval(clean_cached_images, 120000);

app.listen(3000);
console.log('Listening on port 3000');