/*
(C) 2017-2020 - The Woorti app is a research (non-commercial) application that was
developed in the context of the European research project MoTiV (motivproject.eu). The
code was developed by partner INESC-ID with contributions in graphics design by partner
TIS. The Woorti app development was one of the outcomes of a Work Package of the MoTiV
project.
 
The Woorti app was originally intended as a tool to support data collection regarding
mobility patterns from city and country-wide campaigns and provide the data and user
management to campaign managers.
 
The Woorti app development followed an agile approach taking into account ongoing
feedback of partners and testing users while continuing under development. This has
been carried out as an iterative process deploying new app versions. Along the 
timeline,various previously unforeseen requirements were identified, some requirements
Were revised, there were requests for modifications, extensions, or new aspects in
functionality or interaction as found useful or interesting to campaign managers and
other project partners. Most stemmed naturally from the very usage and ongoing testing
of the Woorti app. Hence, code and data structures were successively revised in a
way not only to accommodate this but, also importantly, to maintain compatibility with
the functionality, data and data structures of previous versions of the app, as new
version roll-out was never done from scratch.

The code developed for the Woorti app is made available as open source, namely to
contribute to further research in the area of the MoTiV project, and the app also makes
use of open source components as detailed in the Woorti app license. 
 
This project has received funding from the European Union’s Horizon 2020 research and
innovation programme under grant agreement No. 770145.
 
This file is part of the Woorti app referred to as SOFTWARE.
*/

var express = require("express");
var https = require('https');
var fs = require('fs');
var path = require("path");
var bodyParser = require('body-parser');
var morgan = require('morgan');


require('./server_api/models/databases');
require('./server_api/serverJobs');
require('./server_api/emailSender');

var routesApi = require('./server_api/routes/apiRoutes');
var routesUtil = require('./server_api/routes/utilRoutes');
var routesBackoffice = require('./server_api/routes/backofficeRoutes');

// Push notifications test start
require('./server_api/pushnotifications/pushnotifications');
// Push notifications test end


var app = express();

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '20mb'
}));
app.use(bodyParser.json({
  extended: true,
  limit: '20mb'
}));

app.use(morgan("common"));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization");
  res.header("Access-Control-Allow-Methods", "POST", "GET", "PUT", "OPTIONS", "DELETE");
  next();
});


app.use('/util', routesUtil); // router from routes/utilRoutes.js
app.use('/backoffice', routesBackoffice); // router from routes/utilRoutes.js
app.use('/api', routesApi); // router from routes/apiRoutes.js


// Support for serving the html pages:

// Allowed extensions list can be extended depending on your own needs
const allowedExt = [
  '.js',
  '.ico',
  '.css',
  '.png',
  '.jpg',
  '.woff2',
  '.woff',
  '.ttf',
  '.svg',
];

// Redirect all the other resquests
app.get('*', (req, res) => {
  var pathUrl = `dist/angular-motiv-app/${req.url.slice(1)}`;
  // console.log("Path url: ", pathUrl);
  if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
    res.sendFile(path.resolve(pathUrl));
  } else {
    res.sendFile(path.resolve('dist/angular-motiv-app/index.html'));
  }
});

const PORT = process.env.PORT || 8000;
const RUN_HTTPS = process.env.RUN_HTTPS;

var server;
if (RUN_HTTPS === "true"){
  console.log("The server is running using HTTPS");
  // Certificate
  //const privateKey = fs.readFileSync('<private-key-path>', 'utf8');
  //const certificate = fs.readFileSync('<certificate-path>', 'utf8');
  //const ca = fs.readFileSync('<ca-path>', 'utf8');

  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };
  server = https.createServer(credentials, app).listen(PORT, "0.0.0.0", function(){
    console.log('Motiv server (HTTPS) listening on port ' + PORT);
  });

} else {
  console.log("The server is running using HTTP");

  app.listen(PORT, "0.0.0.0", function () {
    console.log('Motiv server (HTTP) listening on port ' + PORT);
  });
}


