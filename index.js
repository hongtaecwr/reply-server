// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
var ParseDashboard = require('parse-dashboard');


var databaseUri = 'mongodb://heroku_w88vtq1s:njutckonn64fdp2h1nuuvop7cp@ds131258.mlab.com:31258/heroku_w88vtq1s';

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

//var allowInsecureHTTP = true;
var trustProxy = true;
var dashboard = new ParseDashboard({
  "apps": [{
    "serverURL": "https://reply-msg-server.back4app.com/parse/",
    "appId": "Yd1Y1mmVSi0lvUHkqxgCWXRp3rKgcFL0CfRaqm9j",
    "masterKey": "PZ7YYchzkikiyNrxusJNTQcDBr3Igkqs49jyKWDP",
    "appName": "reply-msg-server",
    "restKey": "SOBy9nZ0uRxlWXDKNZuSS4oti7IpQof1W5lBv1bV"
  }],
  "users": [{
    "user": "hongtaedb",
    "pass": "hongtae123"
  }],
  "trustProxy": 1
});

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://admin:N3rUUA6FQ0RzZvKq4Vxl2Wie@mongodb.back4app.com:27017/69351ab05bfa4fe4a23e7e87a45574bd?ssl=true',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'Yd1Y1mmVSi0lvUHkqxgCWXRp3rKgcFL0CfRaqm9j',
  masterKey: process.env.MASTER_KEY || 'PZ7YYchzkikiyNrxusJNTQcDBr3Igkqs49jyKWDP', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'https://reply-msg-server.back4app.com/parse', // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/dashboard', dashboard);

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
