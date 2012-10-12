var express = require('express');
var app = express();

app.get('/', function(req, res){
	var width = req.query.w,
		height = req.query.h,
		url = req.query.u;

	validateQueryStringParameters(width, height, url, res);

  res.send('Hello World');
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


app.listen(3000);
console.log('Listening on port 3000');