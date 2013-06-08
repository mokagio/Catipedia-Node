var testFileName = "hola.jpg";
var testDirName = "test";
var testPahtOnServer = '/' + testDirName + '/' + testFileName;

var express = require("express");
var multipart = require("multipart");
var app = express();
app.use(express.logger());

// TODO find out about coding style and where to place the require
var fs = require("fs");

var knox = require("knox");
var s3Client = knox.createClient({
	key: process.env.AWS_ACCESS_KEY_ID,
	secret: process.env.AWS_SECRET_ACCESS_KEY,
	bucket: "catipedia.memrise.com"
});

app.get('/', function(request, response) {
  response.send('Hello World!');
});

app.get('/upload-test/', function(request, response) {
	fs.readFile(testFileName, function(err, buf){
		var req = s3Client.put(testPahtOnServer, {
			'Content-Length': buf.length,
			'Content-Type': 'text/plain'
		});
		req.on('response', function(res){
			if (200 == res.statusCode) {
				console.log('saved to %s', req.url);
				response.writeHead(200, { 'Content-Type': 'application/json' });
				response.end();
			}
		});
		req.end(buf);
	});
});

app.post('/upload/', function(request, response) {
	request.setBodyEncoding('binary');

	var stream = new multipart.Stream(request);
	stream.addListener('part', function(part){
		part.addListener('body', function(chunck) {
			var progress = (stream.bytesReceived / stream.bytesTotal * 100).toFixed(2);
			var mb = (stream.bytesTotal / 1024 / 1024).toFixed(1);
		});
		console.log("Uploading " + mb + "MB (" + progress + "%)");
	});
	stream.addListener('complete', function() {
		response.sendHeader(200, {'Content-Type':'application/json'});
		response.finish();
		console.log("Done :)");
	});
});

app.get('/cats/', function(request, response) {
	var pg = require('pg');

	var result = [];
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		var query = client.query('SELECT * FROM entries');

		query.on('row', function(row) {
			result.push(row);
		});

		query.on('end', function() {
			console.log(result);
			var objToJson = { "entries":result };
			response.writeHead(200, {"Content-Type": "application/json"});
			response.write(JSON.stringify(objToJson));
			response.end();
		});
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});