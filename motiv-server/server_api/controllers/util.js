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


/**
 * Util Controller 
 * This module contains code to be used across the project by other modules
 */
var mongoose = require('mongoose');
var databases = require('../models/databases');
var tripDB = mongoose.model('Trip');
var usersDB = mongoose.model('User');

module.exports.ping = function (req, res){
    res.status(200).json("OK");
};

/**
 * Returns the list of points of a trip
 * @param req.params.tripid contains a tripid
 */
module.exports.csvPoints = function (req, res) {
    var tripIdComponents = req.params.tripid.split("-");
    var tripid = "#" + tripIdComponents[0] + ":" + tripIdComponents[1];
    // new version of orientdb invocation:
    databases.orientdbPool.acquire().then((orientdbSession) => {
        orientdbSession.query("select getCoordinatesOfTrip("+ JSON.stringify(tripid) +")").one().then((response) => {
            var orientResult = response[Object.keys(response)[0]];                  // hack, response has always 1 key
            if (orientResult["error"] !== undefined){
                console.log("-- csvPoints: orient error :" + orientResult["error"]);
                res.status(500).json(orientResult);
            } else {
                res.status(200).json(orientResult);           
            }
            orientdbSession.close();
        }).catch(function(orientError){
            console.log("-- csvPoints: orient error : ", orientError);
            res.status(500).json(orientError);
            orientdbSession.close();
        });
    });

};

/**
 * Deprecated
 * Returns the raw data of a trip
 */
module.exports.rawDataCsv = function (req, res) {
    var rawPartNumber = req.params.partnum;
    console.log("-- rawDataCsv: Received rawPartNumber : " + rawPartNumber);
    // new version of orientdb invocation:
    databases.orientdbPool.acquire().then((orientdbSession) => {
        orientdbSession.query("select getRawData("+ JSON.stringify(rawPartNumber) +")").one().then((response) => {
            var orientResult = response[Object.keys(response)[0]];                  // hack, response has always 1 key
            if (orientResult["error"] !== undefined){
                console.log("-- rawDataCsv: orient error :" + orientResult["error"]);
                res.status(500).json(orientResult);
            } else {
                res.status(200).json(orientResult);           
            }
            orientdbSession.close();
        }).catch(function(orientError){
            console.log("-- rawDataCsv: orient error : ", orientError);
            res.status(500).json(orientError);
            orientdbSession.close();
        });
    });
    
};

/**
 * Returns the number of trips in a certain interval of time
 * @param query interval
 */
var tripsInIntervalDbRequest = function (query, callback) {
    tripDB.count(query, function (countError, numberOfTrips) {       // count() is listed as deprecated, but countDocuments doesnt work!
        if (countError){
            console.log("ERROR:", countError);
            return callback(countError, null, null);
        }
        else{
            tripDB.distinct("userid", query, (errorUniqueUsers, uniqueUsers) => {
                if (errorUniqueUsers) {
                    console.log("ERROR:", errorUniqueUsers);
                    return callback(errorUniqueUsers, null, null);
                }
                else {
                    callback(null, numberOfTrips, uniqueUsers.length);
                }
            });
        }
    });
}

/**
 * Removes duplicate trips in a list (@param trips)
 * @return trips without duplicates
 */
var removeDuplicatedTrips = function(trips){
    var mapUserStartDate = {};
    var duplicated = false;
    for(var i=0; i<trips.length;i++){
        duplicated = false;
        if(trips[i]==undefined || trips[i].startDate===undefined || trips[i].userid===undefined){
            continue;}
        if(mapUserStartDate[trips[i].userid]===undefined){
            mapUserStartDate[trips[i].userid]=[];
            mapUserStartDate[trips[i].userid].push(trips[i].startDate);
            continue;
        }
        for(var j=0; j<mapUserStartDate[trips[i].userid].length;j++){
            if(mapUserStartDate[trips[i].userid][j]==trips[i].startDate){
                duplicated=true;
                trips.splice(i,1);
                i=i-1;
                break;
            }
        }
        if(!duplicated){
            mapUserStartDate[trips[i].userid].push(trips[i].startDate);
        }
    }
    return trips;
}

/**
 * Returns the total number of trips without duplicates
 * @return res["count"]
 */
module.exports.getTotalTripsWithoutDuplicates = function (req, res) {
    tripDB.find({}, function (error, trips) {
        if(error){
            console.log("getTotalTripsWithoutDuplicates "+error)
            res.status(500).json({"error" : error});
        }
        else{
            removeDuplicatedTrips(trips);
            res.status(200).json({"count":trips.length});
        }
    })

}

/**
 * Returns statistics for a certain interval of time on a certain campaign
 * @param req.query.leftLimitTs
 * @param req.query.rightLimitTs
 * @param req.query.campaignid
 * @return res["users"]
 * @return res["trips"]
 */
module.exports.getStatistics = function (req, res) {
    var tripsInIntervalDbRequestHandler = function(error, numOfTrips, numOfUsers) {
        if (error){
            console.log('-- getStatistics: ' + error);
            res.status(500).json({"error" : error});
            return;
        }
        else {
            res.status(200).json({"users": numOfUsers, "trips": numOfTrips});
            return;
        }
    };
    var leftLimitTs = JSON.parse(req.query.leftLimitTs);
    var rightLimitTs = JSON.parse(req.query.rightLimitTs);
    var campaignid = JSON.parse(req.query.campaignid);
    if (campaignid !== ""){                 // data about specific campaign
        console.log('-- getStatistics: sending data of campaign ', campaignid);
        var queryUsers = {"onCampaigns": campaignid};
        var projectionUsers = {"userid": 1, "_id": 0}; // get userid and exclude _id
        usersDB.find(queryUsers, projectionUsers, function (errUsers, usersInCampaign){
            if (errUsers){
                console.log('-- getStatistics: ' + errUsers);
                res.status(500).json(errUsers);
                return;
            }
            var usersOfCampaign = [];
            usersInCampaign.forEach( (elem) => {
                usersOfCampaign.push(elem.userid);
            });
            var queryToExecute;
            if (leftLimitTs === -1 && rightLimitTs === -1){ // get overall statistics
                queryToExecute = {"userid": {"$in": usersOfCampaign}};
            } else {
                // !! need to multiply by 1000 because the startDate is multiplied by 1000 when saved in DB (see Trip model):
                var queryleftLimitTs = leftLimitTs * 1000;
                var queryrightLimitTs = rightLimitTs * 1000;
                queryToExecute = {
                    "userid": {"$in": usersOfCampaign},
                    "startDate": {$gte: queryleftLimitTs, $lte: queryrightLimitTs}
                }; 
            }
            tripsInIntervalDbRequest(queryToExecute, tripsInIntervalDbRequestHandler);
        });
    } else {                                // data about all the camppaigns
        console.log('-- getStatistics: sending data of all campaigns');
        var queryToExecute;
        if (leftLimitTs === -1 && rightLimitTs === -1){ // get overall statistics
            queryToExecute = {};
        } else {
            // !! need to multiply by 1000 because the startDate is multiplied by 1000 when saved in DB (see Trip model):
            var queryleftLimitTs = leftLimitTs * 1000;
            var queryrightLimitTs = rightLimitTs * 1000;
            queryToExecute = { "startDate": {$gte: queryleftLimitTs, $lte: queryrightLimitTs} }; 
        }
        tripsInIntervalDbRequest(queryToExecute, tripsInIntervalDbRequestHandler);
    }
};