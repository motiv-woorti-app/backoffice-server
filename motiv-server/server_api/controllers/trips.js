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
 * Trips Controller
 * 
 * This module is responsible for processing incoming trips and retrieving trip data  
 */
var mongoose = require('mongoose');
var databases = require('../models/databases');
var tripDB = mongoose.model('Trip');
var usersDB = mongoose.model('User');
var dirtyDaysDB = mongoose.model('DirtyDays');
var tripDigestsDB = mongoose.model('TripDigests');
var campaignsCollection = databases.campaignDbConnection.model('campaign');
var validator = require('../validators/validator');
var fs = require('fs'); 

var authentication = require("../authentication");

global.lastLegStartUpdate = undefined;

//timestamp to export trips/tripsInfo after a certain date (*1000)
global.lowerLimitTimestamp = 0;

/**
 * Checks if there is a row with a userid and startdate ts value in tripDB
 * 
 * @param bodyUserid userid
 * @param bodyStartDate timestamp
 */
var checkTripExistence = function (bodyUserid, bodyStartDate, callback) {
    tripDB.find({userid: bodyUserid, startDate: bodyStartDate}, function (errorCheck, tripinDb){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            if (tripinDb.length !== 0){
                callback(null, tripinDb[0].tripid);
            }
            else {
                callback(null, null);
            }
        }
    });
};


/**
 * Fetch user email
 * 
 * @param useridToFetch userid
 */
var fetchEmailOfUser = function (useridToFetch) {
    usersDB.find({"userid":useridToFetch}, function (errorDb, userInDb){
        if (errorDb){
            console.log('-- useridToFetch, error: ' + errorDb);
            return;
        } 
        if (userInDb.length !== 0){
            console.log('-- useridToFetch: user with this id already exists');
            return;
        }
        if (userInDb.length === 0){
            console.log('-- useridToFetch: user with this id does not exists');
            // get userid
            authentication.getUserById(useridToFetch, function(errorUser, userEmail){
                if (!errorUser && userEmail){
                    newUser = {
                        userid : useridToFetch,
                        email : userEmail,
                        roles : ["User"],
                        onCampaigns : [],
                        managesCampaigns: []
                    };            
                    usersDB.create(newUser, function(error, user){
                        if (error){
                            console.log('-- useridToFetch: error adding -', error);
                            return;
                        }
                        console.log('-- useridToFetch: User/email added');
                    });
                }
            });
        }
    });
};

module.exports.fetchEmailOfUser = fetchEmailOfUser

/**
 * Create new trip
 * 
 * @param req.body trip object
 * @param req.tokenDecoded.uid userid
 */
module.exports.createNewTrip = function (req, res) {
    if (! validator.validate.CREATE_NEW_ROUTE(req.body) ){
        console.log('-- createNewTrip: Validator Error - ', validator.validate.CREATE_NEW_ROUTE.errors);
        console.log('-- createNewTrip: Invalid Body - ', req.body);
        res.status(400).json({"status" : validator.validate.CREATE_NEW_ROUTE.errors});
        return;
    }    
    fetchEmailOfUser(req.tokenDecoded.uid);
    databases.orientdbPool.acquire().then((orientdbSession) => {
        orientdbSession.query("select addTrip("+ JSON.stringify(req.body) +")").one().then((response) => {
            var orientResult = response[Object.keys(response)[0]];                  // hack, response has always 1 key
            if (orientResult["error"] !== undefined){
                console.log("-- createNewTrip: orient error :" + orientResult["error"]);
                res.status(500).json(orientResult);
            } else {
                console.log('-- createNewTrip: Result from orient: ', orientResult);
                checkTripExistence(req.tokenDecoded.uid, req.body.startDate, function(errorCheck, existingTrip){
                    if (errorCheck){
                        console.log('-- createNewTrip: error ' + errorCheck);
                        res.status(500).json(errorCheck);
                        return;
                    }
                    if (existingTrip){
                        console.log('-- createNewTrip: trip already exists - ' + existingTrip);
                        deleteTrip(req.tokenDecoded.uid, req.body.startDate,existingTrip, function(code, message){
                            console.log("delete: " + code + " " + message)
                        });
                    }
                    var newTrip = {
                        userid : req.tokenDecoded.uid,
                        tripid : orientResult.tripid,
                        startDate : req.body.startDate
                    };
                    tripDB.create(newTrip, function (error, trip){
                        if (error){
                            console.log("-- createNewTrip: mongodb error :" + error);
                            res.status(500).json(error);
                        } else {
                            res.status(200).json(orientResult);
                        }
                    });                
                })
            }
            orientdbSession.close();
        }).catch(function(orientError){
            console.log("-- createNewTrip: orient error : ", orientError);
            res.status(500).json(orientError);
            orientdbSession.close();
        });
    });
};

/**
 * @ignore
 * Not currently used. Used to mark days with new trips submitted so that its stats can be calculated in the end of the day
 * @param startDate timestamp
 */
var insertDirtyDay = function(startDate,callback){
    var tripDate = new Date(startDate);
    tripDate.setHours(0);
    tripDate.setMinutes(0);
    tripDate.setSeconds(0);
    tripDate.setMilliseconds(0);
    dirtyDaysDB.find({"date":tripDate.getTime()},function(err,item){
        if(err){
            callback(err);
        }
        else{
            if(item!= undefined && item!=null && item["date"]!= undefined && item["date"]!= null){
                console.log("-- Dirty day already exists");
                callback(null);
            }
            else{
                dirtyDaysDB.create({"date":tripDate.getTime()},function(error){
                    if(error){
                        callback(error);
                    }
                    else{
                        console.log("-- Dirty day inserted. Will be processed later");
                        callback(null);
                    }
                })
            }
        }
    })
}

/**
 * Deletes trips
 * @ignore
 * 
 * @param req.params.tripid tripid to be deleted
 */
module.exports.deleteTrip = function (req, res) {
    if (!req.params.tripid){
        console.log('-- deleteTrip: tripid is missing in request');
        res.status(400).json({"status" : "tripid is missing in request"});
        return;
    }
    var regExpr = /^[0-9]+-[0-9]+$/;
    if (!regExpr.test(req.params.tripid)){
        console.log('-- deleteTrip: invalid format of tripid');
        res.status(400).json({"status" : "invalid format of tripid"});
        return;
    }
    var tripIdComponents = req.params.tripid.split("-");
    var tripId = "#" + tripIdComponents[0] + ":" + tripIdComponents[1];
    res.status(code).json("delete trip deactivated");
};

/**
 * @ignore
 * 
 * Deleting trips is deactivated
 * 
 * Deletes trip
 *
 * @param {*} userid 
 * @param {*} startDate 
 * @param {*} tripId 
 * @param {*} callback 
 */
var deleteTrip = function(userid,startDate, tripId, callback) {
    console.log("--####delete trip BEFORE:" + userid + ", " + startDate + ", " + tripId);
    tripDB.findOneAndRemove({"tripid" : tripId,"userid":userid,"startDate":startDate}, function (error, removedTrip){
        if (error){
            console.log('-- deleteTrip: ' + error);
            callback(500, error)
            return;
        }
        if (!removedTrip) {
            console.log('-- deleteTrip: trip ' + tripId + " does not exist");
            callback(404, "Trip " + tripId + " does not exist")
            return;
        }
        else{
            console.log('-- deleteTrip: AFTER - trip removed - ', removedTrip.userid, ", ", removedTrip.startDate, ", ", removedTrip.tripid);
            callback(204, {});  
        }
    }); 
};

/**
 * Get long trips from db
 * 
 * @returns trips with 500+km
 */
module.exports.getLongTripsSummary = function (req, res) {
    usersDB.find({}, "userid email", function (errorUsers, users){
        if (errorUsers) {
            res.status(500).json(errorUsers);
            console.log("-- getTripsSummary: Error mongo - " + errorUsers);
            return;
        }
        var uidAndEmail = {};
        for (var i = 0; i<users.length; i++){
            uidAndEmail[users[i].userid] = users[i].email;
        }
        tripDB.find({}, "userid tripid", {sort: {"startDate": "descending"}}, function(errorTrip, trips) {
            if (errorTrip) {
                res.status(500).json(errorTrip);
                console.log("-- getTripsSummary: Error mongo - " + errorTrip);
                return;
            }
            var tripAndEmailAndUid = [];
            for (var i = 0; i<trips.length; i++){
                tripAndEmailAndUid.push({
                    "tripid": trips[i].tripid,
                    "email": uidAndEmail[trips[i].userid],
                    "userid": trips[i].userid
                });
            }
            // new version of orientdb invocation:
            databases.orientdbPool.acquire().then((orientdbSession) => {
                orientdbSession.query("select getLongTripsSummary("+ JSON.stringify(tripAndEmailAndUid) +")").one().then((response) => {
                    var orientResult = response[Object.keys(response)[0]];
                    if (orientResult["error"] !== undefined){
                        console.log("-- getLongTripsSummary: orient error :" + orientResult["error"]);
                        res.status(500).json(orientResult);
                    } else {
                        console.log("Number of tripes 500+ km: "+orientResult.length);
                        res.status(200).json(orientResult);           
                    }
                    orientdbSession.close();
                }).catch(function(orientError){
                    console.log("-- getLongTripsSummary: orient error : ", orientError);
                    res.status(500).json(orientError);
                    orientdbSession.close();
                });
            });
        });
    });
}

/**
 * Get trips digests
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getTripDigests = function (req,res){
    tripDigestsDB.find({}, function (error, trips){
        if(error){
            console.log("--- getTripDigests error : "+error);
            res.status(500).json({});
        }
        else{
            console.log("--- getTripDigests Success ");
            res.status(200).json(trips);
        }
    })
}

/**
 * Update trip digests
 * 
 * @param req.tokenDecoded.uid userid
 * @param req.body list of trip digests
 */
module.exports.updateTripDigests = function (req,res){
    var insertTripDigest = function(tripDigests,userid,callback){
        if(tripDigests.length===0){
            return callback(null);
        }
        var currTrip = tripDigests.shift()
        var query = {"userid" : userid , "startDate" : currTrip.startDate};
        var options = { upsert: true};
        var update = {"userid" : userid , "startDate" : currTrip.startDate, "totalDistance" : currTrip.totalDistance, "totalTime" : currTrip.totalTime};
        if(userid===undefined || currTrip.startDate === undefined || currTrip.totalDistance===undefined || currTrip.totalTime===undefined){
            return insertTripDigest(tripDigests,userid,callback);
        }
        tripDigestsDB.findOneAndUpdate(query,update,options , function (error, trips){
            if(error){
                return callback(error);
            }
            else{
                return insertTripDigest(tripDigests,userid,callback);
            }
        })
    }
    var userid = req.tokenDecoded.uid;
    insertTripDigest(req.body,userid,function(error){
        if(error){
            console.log("--- updateTripDigests error : "+error);
            res.status(500).json({});
        }
        else{
            console.log("--- updateTripDigests SUCCESS ");
            res.status(200).json({"Success": true});
        }
    })
}

/**
 * Get trips summary
 * 
 * @returns stats between @param req.query.leftLimitTs and @param req.query.rightLimitTs
 */
module.exports.getTripsSummary = function (req, res) {
    var leftLimitTs = JSON.parse(req.query.leftLimitTs);
    var rightLimitTs = JSON.parse(req.query.rightLimitTs);
    usersDB.find({}, "userid email", function (errorUsers, users){
        if (errorUsers) {
            res.status(500).json(errorUsers);
            console.log("-- getTripsSummary: Error mongo - " + errorUsers);
            return;
        }
        var uidAndEmail = {};
        for (var i = 0; i<users.length; i++){
            uidAndEmail[users[i].userid] = users[i].email;
        }
        // !! need to multiply by 1000 because the startDate is multiplied by 1000 when saved in DB (see Trip model):
        var queryLeftLimitTs = leftLimitTs * 1000;
        var queryRightLimitTs = rightLimitTs * 1000;
        var queryTripsInInterval = { "startDate": {$gte: queryLeftLimitTs, $lte: queryRightLimitTs} }; 
        tripDB.find(queryTripsInInterval, "userid tripid", {sort: {"startDate": "descending"}}, function(errorTrip, trips) {
            if (errorTrip) {
                res.status(500).json(errorTrip);
                console.log("-- getTripsSummary: Error mongo - " + errorTrip);
                return;
            }
            var tripAndEmailAndUid = [];
            for (var i = 0; i<trips.length; i++){
                tripAndEmailAndUid.push({
                    "tripid": trips[i].tripid,
                    "email": uidAndEmail[trips[i].userid],
                    "userid": trips[i].userid
                });
            }
            // new version of orientdb invocation:
            databases.orientdbPool.acquire().then((orientdbSession) => {
                orientdbSession.query("select getTripStatistics("+ JSON.stringify(tripAndEmailAndUid) +")").one().then((response) => {
                    var orientResult = response[Object.keys(response)[0]];
                    if (orientResult["error"] !== undefined){
                        console.log("-- getTripsSummary: orient error :" + orientResult["error"]);
                        res.status(500).json(orientResult);
                    } else {
                        res.status(200).json(orientResult);           
                    }
                    orientdbSession.close();
                }).catch(function(orientError){
                    console.log("-- getTripsSummary: orient error : ", orientError);
                    res.status(500).json(orientError);
                    orientdbSession.close();
                });
            });
        });
    });
};

/**
 * Get trip info
 * 
 * @param req.params.tripid tripid
 */
module.exports.getTripInfo = function (req, res) {
    if (!req.params.tripid){
        console.log('-- getTripInfo: tripid is missing in request');
        res.status(400).json({"status" : "tripid is missing in request"});
        return;
    }
    var regExpr = /^[0-9]+-[0-9]+$/;
    if (!regExpr.test(req.params.tripid)){
        console.log('-- getTripInfo: invalid format of tripid, must be XX-XXX (default format is #XX:XXX)');
        res.status(400).json({"status" : "invalid format of tripid, must be XX-XXX (default format is #XX:XXX)"});
        return;
    }
    var tripIdComponents = req.params.tripid.split("-");
    var tripId = "#" + tripIdComponents[0] + ":" + tripIdComponents[1];
    tripDB.findOne({"tripid": tripId}, "userid tripid", function(errTrip, tripRes){          
        if (errTrip) {
            res.status(500).json(errTrip);
            console.log("-- getTripInfo: Error mongo - " + errTrip);
            return;
        }
        if (tripRes === null || tripRes === undefined){         //tripRes can be null !!!! need to handle this case!!!
            var errorText = "trip " + tripId + " does not exists.";
            res.status(500).json(errorText);
            console.log("-- getTripInfo:", errorText);
            return;
        }
        usersDB.findOne({"userid": tripRes.userid}, "userid email", function (errorUsers, user){
            if (errorUsers) {
                res.status(500).json(errorUsers);
                console.log("-- getTripInfo: Error mongo - " + errorUsers);
                return;
            }
            var argToOrient = {"tripid": tripId, "userid": user.userid, "email": user.email};
            databases.orientdbPool.acquire().then((orientdbSession) => {
                orientdbSession.query("select getTripInfo("+ JSON.stringify(argToOrient) +")").one().then((response) => {
                    var orientResult = response[Object.keys(response)[0]];
                    if (orientResult["error"] !== undefined){
                        console.log("-- getTripInfo: orient error :" + orientResult["error"]);
                        res.status(500).json(orientResult);
                    } else {
                        res.status(200).json(orientResult);           
                    }
                    orientdbSession.close();
                }).catch(function(orientError){
                    console.log("-- getTripInfo: orient error : ", orientError);
                    res.status(500).json(orientError);
                    orientdbSession.close();
                });
            });
        });
    });
};

/**
 * Get trips for mode statistics
 * 
 * @returns transport mode stats for a campaign
 * @param req.query.campaignid
 */
module.exports.getTripsForModeStatistics = function(req,res){
    var campaignid = JSON.parse(req.query.campaignid);
    campaignsCollection.findById(campaignid, function(errCampaigns, responseCampaigns){
        if (errCampaigns){
            console.log('-- getTripsForModeStatistics: ' + errCampaigns);
            res.status(500).json({"error" : errCampaigns});
            return;
        } else {
            var usersInCurrentCampaign = responseCampaigns.usersOnCampaign;
            if (usersInCurrentCampaign.length === 0){
                res.status(200).json({"trips": []});
                return;
            }
            var usersBlackList = [];
            if (responseCampaigns.usersToIgnoreFromStats !== undefined) {
                usersBlackList = responseCampaigns.usersToIgnoreFromStats;
            }
            console.log("-- getTripsForModeStatistics: Users in black list: ", usersBlackList);
            var campaignName = responseCampaigns.name;
            var queryToPerform = {"userid": {"$in": usersInCurrentCampaign, "$nin": usersBlackList} };
            var tripsProjection = {"tripid":1, "userid":1, "startDate":1, "_id": 1};
            tripDB.find(queryToPerform, tripsProjection, {"sort": {"startDate": 1}}, function(tripsErr, tripids){
                if (tripsErr){
                    console.log('-- getTripsForModeStatistics: ' + tripsErr);
                    res.status(500).json({"error" : tripsErr});
                    return;
                }
                removeDuplicatedTrips(tripids)
                var tripsToGet = [];
                for(var i=tripids.length-1;i>=0;i--){
                    if (tripids[i]._id.getTimestamp() <lowerLimitTimestamp){
                        continue;
                    }
                    tripsToGet.push(tripids[i].tripid);
                }
                databases.orientdbPool.acquire().then((orientdbSession) => {
                    orientdbSession.query("select getStatisticsByCampaign("+ JSON.stringify(tripsToGet) +")").one().then((response) => {
                        var orientResult = response[Object.keys(response)[0]];
                        if (orientResult["error"] !== undefined){
                            console.log("-- getTripsForModeStatistics: orient error :" + orientResult["error"]);
                            res.status(500).json(orientResult);
                        } else {
                            res.status(200).json({"trips": orientResult, "modeStatisticsPreBack": {}});
                        }
                        orientdbSession.close();
                    }).catch(function(orientError){
                        console.log("-- getTripsForModeStatistics: orient error : ", orientError);
                        res.status(500).json(orientError);
                        orientdbSession.close();
                    });
                }).catch(function(poolError){
                    console.log("-- getTripsForModeStatistics: ERROR : ", poolError);
                    res.status(500).json(poolError);
                });
            });

        }
    });
}

/**
 * Get trips summary by campaign
 * 
 * @param req.query.campaignid
 * @param req.query.leftLimitTs
 * @param req.query.rightLimitTs
 */
module.exports.getTripsSummaryByCampaign = function(req, res) {
    var campaignid = JSON.parse(req.query.campaignid);
    var leftLimitTs = JSON.parse(req.query.leftLimitTs);
    var rightLimitTs = JSON.parse(req.query.rightLimitTs);
    campaignsCollection.findById(campaignid, function(errCampaigns, responseCampaigns){
        if (errCampaigns){
            console.log('-- getTripsSummaryByCampaign: ' + errCampaigns);
            res.status(500).json({"error" : errCampaigns});
            return;
        } else {
            var usersInCurrentCampaign = responseCampaigns.usersOnCampaign;
            if (usersInCurrentCampaign.length === 0){
                res.status(200).json({"trips": [], "users": [], "tripsOfUsers": []});
                return;
            }
            var usersBlackList = [];
            if (responseCampaigns.usersToIgnoreFromStats !== undefined) {
                usersBlackList = responseCampaigns.usersToIgnoreFromStats;
            }
            console.log("-- getTripsSummaryByCampaign: Users in black list: ", usersBlackList);
            var queryToPerform;
            if (leftLimitTs === -1){        // all the time
                queryToPerform = {"userid": {"$in": usersInCurrentCampaign, "$nin": usersBlackList} };
            } else {                        // specific time interval
                // !! need to multiply by 1000 because the startDate is multiplied by 1000 when saved in DB (see Trip model):
                var queryLeftLimitTs = leftLimitTs * 1000;
                var queryRightLimitTs = rightLimitTs * 1000;
                queryToPerform = {"userid": {"$in": usersInCurrentCampaign, "$nin": usersBlackList}, "startDate": {$gte: queryLeftLimitTs, $lte: queryRightLimitTs}  };
            }
            var tripsProjection = {"tripid":1, "userid":1, "startDate":1, "_id": 0};
            tripDB.find(queryToPerform, tripsProjection, {"sort": {"startDate": 1}}, function(tripsErr, tripids){
                if (tripsErr){
                    console.log('-- getTripsSummaryByCampaign: ' + tripsErr);
                    res.status(500).json({"error" : tripsErr});
                    return;
                }
                console.log("number of trips (with duplicates)= ", tripids.length);
                removeDuplicatedTrips(tripids)
                var tripsToGet = [];
                var usersWithTripsInIntervalSet = {};
                tripids.forEach( (elem) => {
                    tripsToGet.push(elem.tripid);
                    usersWithTripsInIntervalSet[elem.userid] = true;
                });
                console.log("number of trips to get from mongo = ", tripsToGet.length);
                if (tripsToGet.length === 0){
                    res.status(200).json({"trips": [], "users": [], "tripsOfUsers": []});
                    return;
                }
                var usersWithTripsInInterval = Object.keys(usersWithTripsInIntervalSet);
                queryToPerform = {"userid": {"$in": usersWithTripsInInterval} };
                var usersProjection = {"_id": 0, "userid": 1, "userSettings": 1};
                usersDB.find(queryToPerform, usersProjection, function(usersError, usersInCampaign){
                    if (usersError){
                        console.log('-- getTripsSummaryByCampaign: ' + usersError);
                        res.status(500).json({"error" : usersError});
                        return;
                    }
                    res.status(200).json({"trips": [], "users": usersInCampaign, "tripsOfUsers": tripids});      
                });

            });

        }
    });
};

/**
 * Remove duplicated trips
 * 
 * @param trips list of trips
 * @returns trips without duplicates but it alters the list so the return does not actually matter
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
 * Remove duplicated trips version 2
 * 
 * This version removes from 2 slightly different lists
 * 
 * @param trips list of trips from mongodb
 * @param tripsOrient list of trips from orientdb
 */
var removeDuplicatedTripsVersion2 = function(trips,tripsOrient){
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
                tripsOrient.splice(i,1);
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
 * Get trip data
 * 
 * @returns trips detailed info for @param req.query.campaignid
 */
module.exports.getTripData = function(req, res) {
    var campaignid = JSON.parse(req.query.campaignid);
    var orientdbQuery = function(queryToPerform) {
        var projection = {"tripid":1,"userid":1,"startDate":1, "_id": 1};
        var options = {sort: {"_id": "descending"}};
        tripDB.find(queryToPerform, projection, options, function(tripsErr, tripids){
            if (tripsErr){
                console.log('-- getTripData: ' + tripsErr);
                res.status(500).json({"error" : tripsErr});
                return;
            }
            var tripsToGet = [];
            var tripsStartDate = {};
            var tripsMongoCreationDate = {};
            var tripsUsers = {};
            for(var i=tripids.length-1;i>=0;i--){
                if (tripids[i]._id.getTimestamp() <lowerLimitTimestamp){
                    continue;
                }
                tripsToGet.push(tripids[i].tripid);
                tripsMongoCreationDate[tripids[i].tripid]=tripids[i]._id.getTimestamp().getTime();
                if(tripids[i].startDate===undefined){
                    tripsStartDate[tripids[i].tripid]=null;
                }
                else{
                    tripsStartDate[tripids[i].tripid]=tripids[i].startDate
                }
                tripsUsers[tripids[i].tripid]=tripids[i].userid
            }
            
            console.log("-- getTripData: number of trips to get = ", tripsToGet.length);
            if (tripsToGet.length === 0){
                res.status(200).json({});
                return;
            }
            // new version of orientdb invocation:
            var tripsToGetFull={"trips":tripsToGet,"tripsStartDate":tripsStartDate,"tripsMongoCreationDate":tripsMongoCreationDate,"tripsUsers":tripsUsers}
            databases.orientdbPool.acquire().then((orientdbSession) => {
                orientdbSession.query("select generateTripData("+ JSON.stringify(tripsToGetFull)+")").one().then((response) => {
                    var orientResult = response[Object.keys(response)[0]];
                    if (orientResult["error"] !== undefined){
                        console.log("-- getTripData: orient error :" + orientResult["error"]);
                        res.status(500).json(orientResult);
                    } else {
                        removeDuplicatedTripsVersion2(orientResult["userTrips"],orientResult["trips"]);
                        res.status(200).json(orientResult);           
                    }
                    orientdbSession.close();
                }).catch(function(orientError){
                    console.log("-- getTripData: orient error : ", orientError);
                    res.status(500).json(orientError);
                    orientdbSession.close();
                });
            });
        });
    };
    var queryToPerform;
    if (campaignid !== ""){                             // trips of specific campaign 
        campaignsCollection.findById(campaignid, function(errCampaigns, campaignObj){
            if (errCampaigns){
                console.log('-- getTripData: ' + errCampaigns);
                res.status(500).json({"error" : errCampaigns});
                return;
            } else {
                var usersInCurrentCampaign = campaignObj.usersOnCampaign;
                if (usersInCurrentCampaign.length === 0){
                    res.status(200).json({});
                    return;
                }
                var usersBlackList = [];
                if (campaignObj.usersToIgnoreFromStats !== undefined) {
                    usersBlackList = campaignObj.usersToIgnoreFromStats;
                }
                console.log("-- getTripData: Users in black list: ", usersBlackList);
                queryToPerform = {"userid": {"$in": usersInCurrentCampaign, "$nin": usersBlackList} };
                orientdbQuery(queryToPerform);
            }
        });
    } else {                                            // all trips
        queryToPerform = {};
        orientdbQuery(queryToPerform);
    }
};

/**
 * Get trips of users data
 * 
 * Returns an array of tripids and their respective users
 * 
 * @param req.query.campaignid
 */
module.exports.getTripsOfUsersData = function (req, res) {
    var campaignid = JSON.parse(req.query.campaignid);
    var executeQuery = function (queryToPerform){
        var projection = { "_id":1, "userid":1, "tripid":1, "startDate": 1};
        tripDB.find(queryToPerform, projection, function(errorUsers, usersTripsList){
            if (errorUsers){
                console.log('-- getTripsOfUsersData: ' + errorUsers);
                res.status(500).json({"error" : errorUsers});
                return;
            } else {
                var usersTripsListToReturn = []
                usersTripsList.forEach(tripOfUser => {      //startDate is multiplied by 1000 when saved in DB (see Trip model):
                    if (tripOfUser.startDate !== undefined){
                        tripOfUser.startDate = tripOfUser.startDate / 1000;
                    }
                    if (tripOfUser._id.getTimestamp() >lowerLimitTimestamp){
                        usersTripsListToReturn.push({"userid":tripOfUser.userid, "tripid":tripOfUser.tripid, "startDate": tripOfUser.startDate});
                    }
                });
                console.log("--getTripsOfUsersData : Number of Trips : "+usersTripsListToReturn.length)
                res.status(200).json(usersTripsListToReturn);
            }
        });
    };
    var queryToPerform;
    if (campaignid !== ""){                             // users of specific campaign 
        campaignsCollection.findById(campaignid, function(errCampaigns, campaignObj){
            if (errCampaigns){
                console.log('-- getTripsOfUsersData: ' + errCampaigns);
                res.status(500).json({"error" : errCampaigns});
                return;
            } else {
                var usersInCurrentCampaign = campaignObj.usersOnCampaign;
                if (usersInCurrentCampaign.length === 0){
                    res.status(200).json({});
                    return;
                }
                var usersBlackList = [];
                if (campaignObj.usersToIgnoreFromStats !== undefined) {
                    usersBlackList = campaignObj.usersToIgnoreFromStats;
                }
                console.log("-- getTripsOfUsersData: Users in black list: ", usersBlackList);
                queryToPerform = {"userid": {"$in": usersInCurrentCampaign, "$nin": usersBlackList} };
                executeQuery(queryToPerform);
            }
        });
    } else {                                            // all users
        queryToPerform = {};
        executeQuery(queryToPerform);
    }
};

/**
 * Get legs start and end positions
 * 
 * Returns a small information about the legs of every trip for @param req.query.campaignid
 */
module.exports.getLegsStartEnd = function(req, res) {
    var orientdbQuery = function(queryToPerform) {
        var projection = {"tripid":1,"userid":1,"startDate":1, "_id": 1};
        var options = {sort: {"_id": "descending"}};
        tripDB.find(queryToPerform, projection, options, function(tripsErr, tripids){
            if (tripsErr){
                console.log('-- getLegsStartEnd: ' + tripsErr);
                res.status(500).json({"error" : tripsErr});
                return;
            }
            var tripsToGet = [];
            var tripsStartDate = {};
            var tripsUsers = {};
            for(var i=tripids.length-1;i>=0;i--){
                if (tripids[i]._id.getTimestamp() <lowerLimitTimestamp){
                    continue;
                }
                tripsToGet.push(tripids[i].tripid);
                if(tripids[i].startDate===undefined){
                    tripsStartDate[tripids[i].tripid]=null;
                }
                else{
                    tripsStartDate[tripids[i].tripid]=tripids[i].startDate
                }
                tripsUsers[tripids[i].tripid]=tripids[i].userid
            }
            console.log("-- getLegsStartEnd: number of trips to get = ", tripsToGet.length);
            if (tripsToGet.length === 0){
                res.status(200).json({});
                return;
            }
            // new version of orientdb invocation:
            var tripsToGetFull={"trips":tripsToGet,"tripsStartDate":tripsStartDate,"tripsUsers":tripsUsers}
            databases.orientdbPool.acquire().then((orientdbSession) => {
                orientdbSession.query("select getLegsStartEnd("+ JSON.stringify(tripsToGetFull)+")").one().then((response) => {
                    var orientResult = response[Object.keys(response)[0]];                  // hack, response has always 1 key
                    if (orientResult["error"] !== undefined){
                        console.log("-- getLegsStartEnd: orient error :" + orientResult["error"]);
                        res.status(500).json(orientResult);
                    } else {
                        removeDuplicatedTripsVersion2(orientResult["userTrips"],orientResult["trips"]);
                        res.status(200).json(orientResult);           
                    }
                    orientdbSession.close();
                }).catch(function(orientError){
                    console.log("-- getLegsStartEnd: orient error : ", orientError);
                    res.status(500).json(orientError);
                    orientdbSession.close();
                });
            });
        });
    };
    var campaignid = JSON.parse(req.query.campaignid);
    var queryToPerform;
    if (campaignid !== ""){                             
        campaignsCollection.findById(campaignid, function(errCampaigns, campaignObj){
            if (errCampaigns){
                console.log('-- getLegsStartEnd: ' + errCampaigns);
                res.status(500).json({"error" : errCampaigns});
                return;
            } else {
                var usersInCurrentCampaign = campaignObj.usersOnCampaign;
                if (usersInCurrentCampaign.length === 0){
                    res.status(200).json({});
                    return;
                }
                var usersBlackList = [];
                if (campaignObj.usersToIgnoreFromStats !== undefined) {
                    usersBlackList = campaignObj.usersToIgnoreFromStats;
                }
                console.log("-- getLegsStartEnd: Users in black list: ", usersBlackList);
                queryToPerform = {"userid": {"$in": usersInCurrentCampaign, "$nin": usersBlackList} };
                orientdbQuery(queryToPerform);
            }
        });
    } else {                                            // all trips
        queryToPerform = {};
        orientdbQuery(queryToPerform);
    }
}
