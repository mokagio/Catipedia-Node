var testFileName = "hola.jpg";
var testDirName = "test";
var testPahtOnServer = '/' + testDirName + '/' + testFileName;

var express = require("express");
var app = express();
app.use(express.logger());

// TODO find out about coding style and where to place the require
var fs = require("fs");

var knox = require("knox");
var configPath = __dirname + '/secret.json';
var s3Client;
fs.readFile(configPath, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  config = JSON.parse(data);
	s3Client = knox.createClient({
		key: config['s3Key'],
		secret: config['s3Secret'],
		bucket: config['s3Bucket']
	});
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

	console.log(request);

	fs.readFile(testFileName, function(err, buf){
		var req = s3Client.put(testPahtOnServer, {
			'Content-Length': buf.length,
			'Content-Type': 'text/plain'
		});
		req.on('response', function(res){
			if (200 == res.statusCode) {
				console.log('saved to %s', req.url);
				response.writeHead(200, { 'Content-Type': 'application/json' });
				response.send({"status":"success"});
				response.end();
			}
		});
		req.end(buf);
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});