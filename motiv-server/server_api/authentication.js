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
var admin = require("firebase-admin");

var mongoose = require('mongoose');
var usersDB = mongoose.model('User');
const fs = require('fs');

var serviceAccount = require("./inesc_firebase_admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://motivandroid-a8771.firebaseio.com"
});

module.exports.checkAuthentication = function (req, res, next){
    if (req.method === "OPTIONS"){     // no authentication check can be done at OPTIONS request.
        // See http://restlet.com/company/blog/2015/12/15/understanding-and-using-cors/
        var headers = {};
        // IE8 does not allow domains to be specified, just the *
        // headers["Access-Control-Allow-Origin"] = req.headers.origin;
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization";
        res.writeHead(200, headers);
        res.end();
        console.log("-- utils.checkAuthentication: OPTIONS request received");
        return;
    }
    if (!req.headers.authorization) {
        console.log("-- utils.checkAuthentication: token in missing in request");
        res.status(401).json({"status" : "token in missing in request"});
        return;
    }
    var tokenAray = req.headers.authorization.split(' ');
    if (tokenAray.length !== 2){
        console.log("-- utils.checkAuthentication: wrong token field. Expected format - [Bearer token]");
        res.status(401).json({"status" : "wrong token field. Expected format - [Bearer token]"});
        return;
    }
    var token = tokenAray[1];
    admin.auth().verifyIdToken(token).then( function(decodedToken) {
        // TODO: check if account is validated?
        req.tokenDecoded = decodedToken;
        console.log("-- utils.checkAuthentication: Middleware, token verified, uid : ", decodedToken.uid);
        next();
    }).catch(function(error) {
        console.log('-- utils.checkAuthentication: ' + error);
        res.status(401).json({"status" : error});
    }); 
};

module.exports.getUserById = function (uid, callback) {
    admin.auth().getUser(uid).then(function(userRecord) {
    // See the UserRecord reference doc for the contents of userRecord.
    console.log("-- utils.getUserById: Successfully fetched user data:", userRecord.email);
    callback(null, userRecord.email);
  }).catch(function(error) {
    console.log("-- utils.getUserById: Error fetching user data:", error);
    callback(error, null);
  });
};

module.exports.checkAdminPrivileges = function (req, res, next) {
    usersDB.find({"userid":req.tokenDecoded.uid}, function (error, userInDb){
        if (error){
            console.log('-- checkAdminPrivileges: ' + error);
            res.status(500).json(error);
            return;
        }
        var userRoles = userInDb[0].roles;
        if (userRoles.indexOf("Admin") > -1 ){  // user has role Admin
            console.log('-- checkAdminPrivileges: user ' + userInDb[0].userid + ' has Admin privileges');
            next();
        } else {
            console.log('-- checkAdminPrivileges: forbidden, user ' + userInDb[0].userid + ' must have Admin privileges to perform this action');
            res.status(403).json("user " + userInDb[0].userid + " must have more privileges to perform this action");
        }
    });
}

module.exports.checkCMorManagerOrAdminPrivileges = function (req, res, next) {
    usersDB.find({"userid":req.tokenDecoded.uid}, function (error, userInDb){
        if (error){
            console.log('-- checkAdminPrivileges: ' + error);
            res.status(500).json(error);
            return;
        }
        var userRoles = userInDb[0].roles;
        if (userRoles.indexOf("Admin") > -1 || userRoles.indexOf("CM") > -1 || userRoles.indexOf("Manager") > -1){  // user has role Admin
            console.log('-- checkAdminPrivileges: user ' + userInDb[0].userid + ' has Admin/CM/Manager privileges');
            next();
        } else {
            console.log('-- checkAdminPrivileges: forbidden, user ' + userInDb[0].userid + ' must have Admin privileges to perform this action');
            res.status(403).json("user " + userInDb[0].userid + " must have more privileges to perform this action");
        }
    });
}

path = require('path'),    

/**
 * returns legal files related to the project
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getLegalFiles = function (req, res) {
    filePath = path.join(__dirname, '../legalfiles/licenses.txt');
    fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
        if (!err) {
            console.log('received data: ' + data);
            res.status(200).json(data);
        } else {
            console.log('error: ' + err);
            res.status(500).json(err);
        }
    });
}