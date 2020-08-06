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
 * Stats controller
 * 
 * Stats are calculated every day for each day between the present day and DAY_MAX days in the past.
 * CURRENT_DAY - number of the day in the past for which the stats are being calculated. CURRENT_DAY = 0 -> today; CURRENT_DAY = 1 -> yesterday ...
 * DAY_MAX - for how many days in the past should the stats be recalculated (limit)
 * 1d-stats: detailed stats for one day considering user (userglobalstats), city (cityglobalstats), campaign (campaignstats)
 * userstats: table containing numberTotalDaysWithTrips and numberTotalTrips for each user
 * summarystats: based on 1d-stats, table containing stats for time intervals with different lengths (1 day, 3 days, 1 week ...)
 */

var mongoose = require('mongoose');
var databases = require('../models/databases');
var usersDB = mongoose.model('User');
var tripDB = mongoose.model('Trip');
var userStatsDB = mongoose.model('UserStats');
var summaryStatsDB = mongoose.model('SummaryStats');
var cityStatsDB = mongoose.model('CityGlobalStats');
var userSummaryStatsDB = mongoose.model('UserGlobalStats');
var campaignStatsDB = mongoose.model('CampaignStats');
var dirtyDaysDB = mongoose.model('DirtyDays');
var campaignDb = databases.campaignDbConnection.model('campaign');
var moment = require('moment');

var CURRENT_DAY = 0;
var DAY_MAX = 7;
var everTimeValue = 9999;

/**
 * Updates 1d-stats:
 * mongodb cityStatsDB: city 1day-stats
 * mongodb campaignStatsDB: campaign 1day-stats
 * @param {*} cities list of city names
 */
var updateStatsLocalFunc =function(cities,callback){
    updateStatsByCity(cities,function(errorCheck){
        if(errorCheck){
            console.log("-- updateStats: updateStatsByCity error");
            return;
        }
        else{
            console.log("-- updateStats: city stats updated");
            var getAllCampaigns = function(callback) {
                campaignDb.find({},{"name": 1,"usersOnCampaign" : 1}, function(errorCheck,campaigns){
                    if (errorCheck){
                        callback(errorCheck, null);
                    }
                    else {
                        callback(null,campaigns);
                    }
                });
            };
            getAllCampaigns(function(errorCheck,campaigns){
                if(errorCheck){
                    console.log("-- updateStats: getAllCampaigns error: "+errorCheck);
                    return;
                }
                else{
                    updateStatsForCampaigns(campaigns, function(errorCheck){
                        if(errorCheck){
                            console.log("-- updateStats: updateStatsForCampaigns error: "+errorCheck);
                            return;
                        }
                        else{
                            console.log("-- updateStats: updateStatsForCampaigns Success");
                            return callback(null);
                        }
                    })
                }
            });
        }
    });
}

/**
* Currently not used
* When a user submits a trip, the stats for that day become out of date. dirtyDaysDb saves the information about which days need to be updated.
* This method fetches all the days in the table dirtyDaysDb and recalculates stats for those days.
* @param cities list of city names
*/
var updateDirtyDaysStats = function(cities,callback){
    dirtyDaysDB.find({},function(error,days){
        if(error){
            callback(error);
        }
        else{
            updateDirtyDaysLoop(cities,days,function(error){
                if(error){
                    callback(error);
                }
                else{
                    callback(null);
                }
            });
        }
    }).limit(20).sort({"date":1});
}

/**
 * Calculates how many days passed from currDay until now
 * @param {number} currDay 
 */
var calcCurrentDay = function(currDay){
    var now = new Date();
    now.setHours(1);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    var nowSec=now.getTime()/1000;
    return (nowSec/86400)-currDay/86400-1;
}

/**
 * Recursive function which iterates all dirty days and updates their stats (1d-stats)
 * @param {*} cities list of city names
 * @param {*} days dirtyDays
 */
var updateDirtyDaysLoop = function(cities,days,callback){
    if(days.length===0){
        return callback(null);
    }
    var currDay= days.shift();
    CURRENT_DAY = calcCurrentDay(currDay["date"]);
    console.log("-- updateStats: updateDirtyDaysLoop -> Recalculating for "+CURRENT_DAY+" ago. ts: "+currDay["date"]);
    var citiesCopy = JSON.parse(JSON.stringify(cities));
    updateStatsLocalFunc(citiesCopy,function(err){
        if(err){
            console.log("-- updateStats: updateStatsLocalFunc error: "+err);
            return callback(err);
        }
        else{
            dirtyDaysDB.remove({date: currDay["date"]},function(errorMongo){
                if(errorMongo){
                    console.log("-- updateStats: updateStatsLocalFunc error: "+errorMongo);
                    return callback(errorMongo);
                }
                else{
                    return updateDirtyDaysLoop(cities,days,callback);
                }
            })
        }
    })

}

//Find and prints duplicated users -> mainly for testing and debugging
module.exports.findDuplicatedUsers = function(){
    var usersDict = {};
    usersDB.find({},function(errorCheck,users){
        if(errorCheck){
            console.log("-- findDuplicatedUsers: "+errorCheck);
        }
        else{
            var count = 0;
            for(var i=0; i<users.length;i++){
                if(usersDict[users[i].userid]===undefined){
                    usersDict[users[i].userid]=users[i].email;
                }
                else{
                    count++
                    console.log("-- findDuplicatedUsers: Repeated user id : "+users[i].userid);
                }
            }
            console.log("-- findDuplicatedUsers: count -> "+count)
        }
    })
}

/**
 * External function to update the dirty days
 * @param {*} cities list of city names
 */
module.exports.updateDirtyDays = function(cities){
    updateDirtyDaysStats(cities,function(error){
        if(error){
            console.log("-- updateDirtyDaysStats error: "+ error);
            return;
        }
        else{   
            console.log("-- updateDirtyDaysStats: Dirty Days updated");
            return;
        }
    })
}

module.exports.updateStats = updateStatsLocalFunc;

/**
 * Updates summarystats for DAY_MAX days in the past for a list of cities
 * @param {*} cities list of city names
 */
module.exports.updateStatsPopulate = function(cities){
    var updateStatsPopulateFunc = function(cities){
        if(CURRENT_DAY===DAY_MAX){
            CURRENT_DAY=0;
            console.log("-- updateStatsPopulate: Finished populate 1daystats");
            return;
        }
        else{
            var citiesCopy = JSON.parse(JSON.stringify(cities));
            console.log("-- updateStatsPopulate: populating 1daystats for "+CURRENT_DAY+" days ago")
            updateStatsLocalFunc(citiesCopy,function(err){
                if(err){
                    console.log("-- updateStatsPopulate: error: "+err);
                    return;
                }
                else{
                    CURRENT_DAY++;
                    updateStatsPopulateFunc(cities);
                }
            })
        }
    }
    updateStatsPopulateFunc(cities);
}

/**
 * Recursive function that updates 1d-stats for a list of @param campaigns
 */
var updateStatsForCampaigns = function(campaigns,callback){
    if(campaigns.length===0){
        return callback(null);
    }
    var currCampaign = campaigns.shift();
    var users = [];
    for(var h=0;h<currCampaign["usersOnCampaign"].length;h++){
        users.push({"userid":currCampaign["usersOnCampaign"][h]});
    }
    getTripIds(users,[],function(errorCheck,result){
        if(errorCheck){
            console.log("getTripIds Campaign error");
            return;
        }
        else{
            var campaign = {};
            campaign["campaign"] = currCampaign["name"];
            campaign["campaignid"] = currCampaign["_id"];
            getTripsFromOrient(result,campaign,function(errorCheck){
                if(errorCheck){
                    console.log("getTripsFromOrientCampaign error ", errorCheck);
                }
                else{                    
                    updateStatsForCampaigns(campaigns,callback);
                }
            });
        }
    });
}

/**
 * Recursive function that updates 1d-stats for a list of @param cities
 */
var updateStatsByCity = function(cities,callback){
    if(cities.length===0){
        callback(null);
        return;
    }
    var currCity = cities.shift();
    getUsersByCity(currCity,function(errorCheck,users){
        if(errorCheck){
            console.log("updateStatsByCity error 1 ",errorCheck);
            return;
        }
        else{
            if(users===null){
                console.log("updateStatsByCity error 2");
                return;
            }
            else{
                getTripIds(users,[],function(errorCheck,result){
                    if(errorCheck){
                        console.log("updateStatsByCity error 3 ", errorCheck);
                    }
                    else{
                        var city = {};
                        city["city"] = currCity;
                        getTripsFromOrient(result,city,function(errorCheck){
                            if(errorCheck){
                                console.log("updateStatsByCity error 4 ", errorCheck);
                            }
                            else{
                                updateStatsByCity(cities,callback);
                            }
                        })
                    }
                }
                );
            }
        }
    });
};

var getUsersByCity = function (city,callback) {
        usersDB.find({"$or" : [{"userSettings.city" : city}]},function(errorCheck, users){
            if (errorCheck){
                callback(errorCheck,null);
            }
            else {
                callback(null,users);
            }
        }
    );  
};

/**
 * Recursive function that returns trips for a day considering the CURRENT_DAY from a list of @param users
 */
var getTripIds = function (users,result,callback){
    if (users.length === 0){
        callback(null, result);
    }
    else {
            var currUser = users.shift();
            var startDate = addDays(new Date(),-(1+CURRENT_DAY));
            var endDate = addDays(new Date(),-(CURRENT_DAY));
            tripDB.find({"$and" :[{"startDate" : {"$gte" : startDate.getTime()*1000}}, {"userid" : currUser["userid"]},{"startDate" : {"$lte" : endDate.getTime()*1000}}]},{"tripid":1, "_id": 0,"userid":1, "startDate":1}, function(err, userTrips){
                if (err){
                    console.log(err);
                    return callback(err, null);
                } else {
                    result = result.concat(userTrips);
                    return getTripIds(users, result, callback);
                }
            });
        }
};

/**
 * Returns trips from OrientDb
 * @param trips tripids
 * @param item used to save context (ex: city, campaign). lately will gather 1d-stats info aswell
 */
var getTripsFromOrient = function(trips,item,callback){
     databases.orientdbPool.acquire().then((orientdbSession) => {
        var query="select getLegsInfoForStats(["+ trips +"])";
        orientdbSession.query(query).one().then((response) => {
            var orientResult = response[Object.keys(response)[0]];
            if (orientResult["error"] !== undefined){
                console.log("updateStatsByCity error 4 :" + orientResult["error"]);
                return;
            } else {
                if(orientResult==undefined || orientResult.length==0){
                    callback(null);           
                }
                else{
                    processTripsInfo(trips,orientResult,item,function(errorCheck){
                        if(errorCheck){
                            console.log("updateStatsByCity error 6 : inserting bd");
                            callback(true);
                        }
                        else{
                            callback(null);
                        }
                    });  
            }    
            }
            orientdbSession.close();
        }).catch(function(orientError){
            console.log("updateStatsByCity error 5 : ", orientError);
            orientdbSession.close();
            callback(true);
        });
    });
};

var maxFromTwoValues = function(value1,value2){
    if((value1>=0 && value1<=2) && (value2>=0 && value2<=2)){
        if(value2>=value1){return value2;}
        else{return value1;}
    }
    if(value1>=0 && value1<=2){
        return value1;
    }
    if(value2>=0 && value2<=2){
        return value2;
    }
    return -1;
}

var getUserIdFromTripsArray = function(array,trip){
    for(var i=0; i<array.length;i++){
        if(array[i]["tripid"]==trip["tripid"]){
            return array[i]["userid"];
        }
    }
    return -1;
}

var removeDuplicatedTrips = function(trips){
    var mapUserStartDate = {};
    var duplicated = false;
    for(var i=0; i<trips.length;i++){
        duplicated = false;
        if(trips[i]==undefined || trips[i].startDate===undefined || trips[i].userid===undefined){continue;}
        if(mapUserStartDate[trips[i].userid]===undefined){
            mapUserStartDate[trips[i].userid]=[];
            mapUserStartDate[trips[i].userid].push(trips[i].startDate);
            continue;
        }
        for(var j=0; j<mapUserStartDate[trips[i].userid].length;j++){
            if(mapUserStartDate[trips[i].userid][j]==trips[i].startDate){
                console.log("Duplicated trip, userid: "+trips[i].userid+" startDate: "+trips[i].startDate);
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
 * Gathers information from all trips to later calc 1d-stats
 * @param {*} tripsWithDuplicated tripids before removing duplicates
 * @param {*} orientResult raw trips from mongo
 * @param {*} itemStats context (ex city campaign) and stats object
 */
var processTripsInfo = function(tripsWithDuplicated,orientResult,itemStats,callback){
    console.log("###################################################################")
    var usersArray={};
    var date = addDays(new Date(),-(1+CURRENT_DAY));
    itemStats["date"] = date.getTime()*1000;       //code 4 is code 0+1
    itemStats["valueFromTripTotal"]=[{"code":0,"value":0},{"code":1,"value":0},{"code":2,"value":0},{"code":3,"value":0},{"code":4,"value":0}];
    itemStats["valueFromTripTotalCount"]=[{"code":0,"count":0},{"code":1,"count":0},{"code":2,"count":0},{"code":3,"count":0},{"code":4,"count":0}];
    itemStats["correctedModes"]=[];
    itemStats["wastedTimeTotal"]=0;
    itemStats["wastedTimeTotalCount"]=0;
    itemStats["overallScoreCount"]=0;
    itemStats["overallScoreTotal"]=0;
    itemStats["totalDuration"]=0;
    itemStats["totalDistance"]=0;
    itemStats["totalLegs"]=0;
    itemStats["totalUsers"]=0;
    if(itemStats["city"]!=undefined){
        console.log("Creating stats for city: "+itemStats["city"] + " for "+date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear());
    }
    if(itemStats["campaignid"]!=undefined){
        console.log("Creating stats for campaign: "+itemStats["campaign"]+ " for "+date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear());
    }
    console.log("Total Trips: "+orientResult.length)
    var trips = removeDuplicatedTrips(tripsWithDuplicated);
    for(var i=0;i<orientResult.length;i++){
        if(orientResult[i]==undefined || Object.keys(orientResult[i]).length===0){
            continue;
        }
        //overall calc
        var overallScore=orientResult[i]["overallScore"];
        if(overallScore>=1 && overallScore<=5 && (typeof overallScore === "number")){
            itemStats["overallScoreCount"]=itemStats["overallScoreCount"]+1;
            itemStats["overallScoreTotal"]=itemStats["overallScoreTotal"]+overallScore;
        }
        var userid= getUserIdFromTripsArray(trips,orientResult[i]);
        if(userid==-1){
            console.log("Trip skipped because duplicated -> tripid:"+orientResult[i].tripid);
            continue;
        }
        else{
            if(usersArray[userid]==undefined){
                usersArray[userid]=1;
                itemStats["totalUsers"]++;
            }
            else{
                usersArray[userid]++;
            }
        }
        //legs iteration calc
        var legs = orientResult[i]["legs"];
        if(legs!=undefined){
            for(var j=0;j<legs.length;j++){
                if(legs[j]["distance"]>5 && (typeof legs[j]["distance"] === "number")) {
                    var duration = legs[j]["endDate"] - legs[j]["startDate"];
                    if(duration>5){
                        itemStats["totalDistance"]=itemStats["totalDistance"]+legs[j]["distance"];
                        itemStats["totalDuration"]=itemStats["totalDuration"]+duration;
                        itemStats["totalLegs"]=itemStats["totalLegs"]+1;
                        
                        //probably need to check if correctedMode is valid
                        var correctedMode = legs[j]["correctedMode"];
                        var modes = itemStats["correctedModes"];
                        var addedMode = false;
                        for(var h=0;h<modes.length; h++){
                            if(modes[h]["mode"]==correctedMode){
                                addedMode=true;
                                modes[h]["count"]=modes[h]["count"]+1;
                                modes[h]["distance"]=modes[h]["distance"]+legs[j]["distance"];
                                modes[h]["duration"]=modes[h]["duration"]+duration;
                            }
                        }
                        if(!addedMode){
                            var modeToAdd = {};
                            modeToAdd.mode=correctedMode;
                            modeToAdd.count=1;
                            modeToAdd.distance=legs[j]["distance"];
                            modeToAdd.duration=duration;
                            modeToAdd["wastedTimeMode"]=0;
                            modeToAdd["wastedTimeWSum"]=0;
                            modeToAdd["wastedTimeModeCount"]=0;
                            modeToAdd["valueFromTripMode"]=[{"code":0,"value":0},{"code":1,"value":0},{"code":2,"value":0},{"code":3,"value":0},{"code":4,"value":0}];
                            modeToAdd["valueFromTripModeCount"]=[{"code":0,"count":0},{"code":1,"count":0},{"code":2,"count":0},{"code":3,"count":0},{"code":4,"count":0}];
                            modeToAdd["valueFromTripModeWSum"]=[{"code":0,"value":0},{"code":1,"value":0},{"code":2,"value":0},{"code":3,"value":0},{"code":4,"value":0}];
                            modes.push(modeToAdd);
                        }
                        //per mode
                        modes = itemStats["correctedModes"];
                        for(var h=0;h<modes.length; h++){
                            if(modes[h]["mode"]==correctedMode){
                                if(legs[j]["wastedTime"]>=1 && legs[j]["wastedTime"]<=5 ){
                                    modes[h]["wastedTimeMode"]=modes[h]["wastedTimeMode"]+legs[j]["wastedTime"];
                                    modes[h]["wastedTimeModeCount"]=modes[h]["wastedTimeModeCount"]+1;
                                    modes[h]["wastedTimeWSum"]=modes[h]["wastedTimeWSum"]+(legs[j]["wastedTime"]*duration);
                                }
                                var valueFromTrip = legs[j]["valueFromTrip"];
                                if(valueFromTrip==null || valueFromTrip.length<1){
                                    break;
                                }
                                for(var l=0;l<valueFromTrip.length; l++){
                                    if(valueFromTrip[l]["value"]>=0 && valueFromTrip[l]["value"]<=2){
                                        modes[h]["valueFromTripMode"][l]["value"]=modes[h]["valueFromTripMode"][l]["value"]+valueFromTrip[l]["value"];
                                        modes[h]["valueFromTripModeCount"][l]["count"]=modes[h]["valueFromTripModeCount"][l]["count"]+1;
                                        modes[h]["valueFromTripModeWSum"][l]["value"]=modes[h]["valueFromTripModeWSum"][l]["value"]+(valueFromTrip[l]["value"]*duration);
                                    }
                                }
                                var thirdValue = maxFromTwoValues(valueFromTrip[0]["value"],valueFromTrip[1]["value"]);
                                if(thirdValue!=-1){
                                    modes[h]["valueFromTripMode"][4]["value"]=modes[h]["valueFromTripMode"][4]["value"]+thirdValue;
                                    modes[h]["valueFromTripModeCount"][4]["count"]=modes[h]["valueFromTripModeCount"][4]["count"]+1;
                                    modes[h]["valueFromTripModeWSum"][4]["value"]=modes[h]["valueFromTripModeWSum"][4]["value"]+(thirdValue*duration);
                                }
                            }
                        }
                    }   
                }

                //global
                if(legs[j]["wastedTime"]>=1 && legs[j]["wastedTime"]<=5 ){
                    itemStats["wastedTimeTotal"]=itemStats["wastedTimeTotal"]+legs[j]["wastedTime"];
                    itemStats["wastedTimeTotalCount"]=itemStats["wastedTimeTotalCount"]+1;
                }

                var valueFromTrip = legs[j]["valueFromTrip"];
                if(valueFromTrip==null || valueFromTrip.length<1){
                    continue;
                }
                for(var h=0;h<valueFromTrip.length; h++){
                    if(valueFromTrip[h]["value"]>=0 && valueFromTrip[h]["value"]<=2){
                        itemStats["valueFromTripTotal"][h]["value"]=itemStats["valueFromTripTotal"][h]["value"]+valueFromTrip[h]["value"];
                        itemStats["valueFromTripTotalCount"][h]["count"]=itemStats["valueFromTripTotalCount"][h]["count"]+1;
                    }
                }
                var thirdValue = maxFromTwoValues(valueFromTrip[0]["value"],valueFromTrip[1]["value"]);
                if(thirdValue!=-1){
                    itemStats["valueFromTripTotal"][4]["value"]=itemStats["valueFromTripTotal"][4]["value"]+thirdValue;
                    itemStats["valueFromTripTotalCount"][4]["count"]=itemStats["valueFromTripTotalCount"][4]["count"]+1;
                }
            }
        }
    }
    for(var k=0;k<itemStats["correctedModes"].length;k++){
        itemStats["correctedModes"][k]["weightedSum"]=(itemStats["correctedModes"][k]["duration"]*itemStats["totalUsers"]);
        if(itemStats["correctedModes"][k]["mode"]===-1){
            itemStats["correctedModes"].splice(k,1);
        }
    }
    if(itemStats["city"]!=undefined){
        cityStatsDB.findOneAndUpdate({"city":itemStats["city"],"date":itemStats["date"]},itemStats,{upsert:true},function(errorCheck){
            if(errorCheck){
                console.log("error inserting in bd "+ itemStats["city"]+ " "+errorCheck);
                callback(true);
            }
            else{
                callback(null);
            }
    });}
    else if(itemStats["campaignid"]!=undefined){
        campaignStatsDB.findOneAndUpdate({"campaignid":itemStats["campaignid"],"date":itemStats["date"]},itemStats,{upsert:true},function(errorCheck){
            if(errorCheck){
                console.log("error inserting in bd "+ itemStats["campaignid"]+ " "+errorCheck);
                callback(true);
            }
            else{
                console.log("campaign "+itemStats["campaignid"]+ " inserted stats");
                callback(null);
            }
        });
    }
    else{
        console.log("error inserting in bd "+errorCheck);
        callback(true);
    }
}

/**
 * Updates user general stats: number of trips, number of days with trips
 */
module.exports.updateUserStats = function(){
    usersDB.find({},{ "userid": 1},function(errorCheck, users){
        if(errorCheck){
            console.log("-- updateUserStats error 1", errorCheck);
            return;
        }
        else{
            getAllTrips(users,{},function(errorCheck,userStatsList){
                if(errorCheck){
                    console.log("-- updateUserStats error 2", errorCheck);
                    return;
                }
                else{
                    updateUsertStatusBd(userStatsList,Object.keys(userStatsList));
                }
            });
        }
    });
}

/**
 * Recursive function that calculates general stats (nr days trips, nr trips) for every user
 * @param users users list
 * @param userStatsList stats for each user
 */
var getAllTrips = function(users,userStatsList,callback){
    if(users.length===0){
        return callback(null,userStatsList);
    }
    var currUser = users.shift();
    tripDB.find({"userid" : currUser["userid"]},{"startDate" : 1,"tripid":1,"userid":1, "_id": 0}, function(err, userTrips){
        if(err){
            console.log("-- getAllTrips error ", err);
            return;
        }
        else{
            removeDuplicatedTrips(userTrips);
            var daysWithTrips = [];
            var user = {};
            var numberTotalTrips = 0;
            for(var i=0;i<userTrips.length;i++){
                numberTotalTrips++;
                if(!isInArray(daysWithTrips,moment(userTrips[i]["startDate"]).format("DD/MM/YYYY"))){
                    daysWithTrips.push(moment(userTrips[i]["startDate"]).format("DD/MM/YYYY"));;
                }
            }
            user["numberTotalTrips"]=numberTotalTrips;
            user["numberTotalDaysWithTrips"]=daysWithTrips.length;
            userStatsList[currUser["userid"]]=user;
            getAllTrips(users,userStatsList,callback);
        }
    });
}

/**
 * Updates user general stats (number trips, number days with trips) for each user
 * @param userStatsList stats for each user
 * @param users list of users
 */
var updateUsertStatusBd = function(userStatsList,users){
    if(users.length===0){
        console.log("Success Update User Stats");
        return;
    }
    var currUser = users.shift();
    userStatsDB.findOneAndUpdate({"userid" : currUser},{"numberTotalDaysWithTrips":userStatsList[currUser]["numberTotalDaysWithTrips"],"numberTotalTrips":userStatsList[currUser]["numberTotalTrips"]},{upsert:true},function(err){
        if(err){
            console.log("updateUserStats error 3 ",err);
            return;
        }
        else{
            updateUsertStatusBd(userStatsList,users);
        }
    });
}

var isInArray = function(array, value) {
    return (array.find(item => {return item == value}) || []).length > 0;
}

/**
 * Returns trips from Orientdb
 * @param trips tripids from mongo
 */
var getUserTripsFromOrient = function(trips,callback){
    databases.orientdbPool.acquire().then((orientdbSession) => {
       var query="select getLegsInfoForStats(["+ trips +"])";
       orientdbSession.query(query).one().then((response) => {
           var orientResult = response[Object.keys(response)[0]];
           orientdbSession.close();
           if (orientResult["error"] !== undefined){
               console.log("updateStatsByCity error 4 :" + orientResult["error"]);
               return callback(orientResult["error"],null);
           } else {
                return callback(null,orientResult);
           }
       }).catch(function(orientError){
           console.log("getUserTripsFromOrient error : ", orientError);
           orientdbSession.close();
           return callback(orientError,null);
       });
   });
};

/**
 * Calculates summary stats for users considering a time interval 
 * These stats are an accumulation of 1d-stats
 * @param orientResult trips
 * @param arg defines lower limit of the time interval
 */
var calculateUserGlobalStatsPerInterval = function(arg,orientResult){
    var lowerLimit = addDays(new Date(),-(arg+CURRENT_DAY));
    var higherLimit = addDays(new Date(),-(CURRENT_DAY));
    var itemStats = {};
    itemStats["date"] = lowerLimit.getTime()*1000;
    itemStats["valueFromTripTotal"]=[{"code":0,"value":0},{"code":1,"value":0},{"code":2,"value":0},{"code":3,"value":0},{"code":4,"value":0}];
    itemStats["valueFromTripTotalCount"]=[{"code":0,"count":0},{"code":1,"count":0},{"code":2,"count":0},{"code":3,"count":0},{"code":4,"count":0}];
    itemStats["correctedModes"]=[];
    itemStats["wastedTimeTotal"]=0;
    itemStats["wastedTimeTotalCount"]=0;
    itemStats["overallScoreCount"]=0;
    itemStats["overallScoreTotal"]=0;
    itemStats["totalDuration"]=0;
    itemStats["totalDistance"]=0;
    itemStats["totalLegs"]=0;
    for(var i=0;i<orientResult.length;i++){
        if(orientResult[i]["startDate"]===undefined){continue;}
        if(orientResult[i]["startDate"]<(itemStats["date"]/1000) || orientResult[i]["startDate"]>higherLimit){
            continue;
        }       
        var overallScore=orientResult[i]["overallScore"];
        if(overallScore>=1 && overallScore<=5 && (typeof overallScore === "number")){
            itemStats["overallScoreCount"]=itemStats["overallScoreCount"]+1;
            itemStats["overallScoreTotal"]=itemStats["overallScoreTotal"]+overallScore;
        }
        //legs iteration calc
        var legs = orientResult[i]["legs"];

        if(legs!=undefined){
            for(var j=0;j<legs.length;j++){
                if(legs[j]["distance"]>5 && (typeof legs[j]["distance"] === "number")) {
                    var duration = legs[j]["endDate"] - legs[j]["startDate"];
                    if(duration>5){
                        itemStats["totalDistance"]=itemStats["totalDistance"]+legs[j]["distance"];
                        itemStats["totalDuration"]=itemStats["totalDuration"]+duration;
                        itemStats["totalLegs"]=itemStats["totalLegs"]+1;
                        
                        //probably need to check if correctedMode is valid
                        var correctedMode = legs[j]["correctedMode"];
                        var modes = itemStats["correctedModes"];
                        var addedMode = false;
                        for(var h=0;h<modes.length; h++){
                            if(modes[h]["mode"]==correctedMode){
                                addedMode=true;
                                modes[h]["count"]=modes[h]["count"]+1;
                                modes[h]["distance"]=modes[h]["distance"]+legs[j]["distance"];
                                modes[h]["duration"]=modes[h]["duration"]+duration;
                            }
                        }
                        if(!addedMode){
                            var modeToAdd = {};
                            modeToAdd.mode=correctedMode;
                            modeToAdd.count=1;
                            modeToAdd.distance=legs[j]["distance"];
                            modeToAdd.duration=duration;
                            modeToAdd["wastedTimeMode"]=0;
                            modeToAdd["wastedTimeWSum"]=0;
                            modeToAdd["wastedTimeModeCount"]=0;
                            modeToAdd["valueFromTripMode"]=[{"code":0,"value":0},{"code":1,"value":0},{"code":2,"value":0},{"code":3,"value":0},{"code":4,"value":0}];
                            modeToAdd["valueFromTripModeCount"]=[{"code":0,"count":0},{"code":1,"count":0},{"code":2,"count":0},{"code":3,"count":0},{"code":4,"count":0}];
                            modeToAdd["valueFromTripModeWSum"]=[{"code":0,"value":0},{"code":1,"value":0},{"code":2,"value":0},{"code":3,"value":0},{"code":4,"value":0}];
                            modes.push(modeToAdd);
                        }
                        //per mode
                        modes = itemStats["correctedModes"];
                        for(var h=0;h<modes.length; h++){
                            if(modes[h]["mode"]==correctedMode){
                                if(legs[j]["wastedTime"]>=1 && legs[j]["wastedTime"]<=5 ){
                                    modes[h]["wastedTimeMode"]=modes[h]["wastedTimeMode"]+legs[j]["wastedTime"];
                                    modes[h]["wastedTimeModeCount"]=modes[h]["wastedTimeModeCount"]+1;
                                    modes[h]["wastedTimeWSum"]=modes[h]["wastedTimeWSum"]+(legs[j]["wastedTime"]*duration);
                                }
                                var valueFromTrip = legs[j]["valueFromTrip"];
                                if(valueFromTrip==null || valueFromTrip.length!=4){
                                    break;
                                }
                                for(var l=0;l<valueFromTrip.length; l++){
                                    if(valueFromTrip[l]["value"]>=0 && valueFromTrip[l]["value"]<=2){
                                        modes[h]["valueFromTripMode"][l]["value"]=modes[h]["valueFromTripMode"][l]["value"]+valueFromTrip[l]["value"];
                                        modes[h]["valueFromTripModeCount"][l]["count"]=modes[h]["valueFromTripModeCount"][l]["count"]+1;
                                        modes[h]["valueFromTripModeWSum"][l]["value"]=modes[h]["valueFromTripModeWSum"][l]["value"]+(valueFromTrip[l]["value"]*duration);
                                    }
                                }
                                var thirdValue = maxFromTwoValues(valueFromTrip[0]["value"],valueFromTrip[1]["value"]);
                                if(thirdValue!=-1){
                                    modes[h]["valueFromTripMode"][4]["value"]=modes[h]["valueFromTripMode"][4]["value"]+thirdValue;
                                    modes[h]["valueFromTripModeCount"][4]["count"]=modes[h]["valueFromTripModeCount"][4]["count"]+1;
                                    modes[h]["valueFromTripModeWSum"][4]["value"]=modes[h]["valueFromTripModeWSum"][4]["value"]+(thirdValue*duration);
                                }
                            }
                        }
                    }   
                }

                //global
                if(legs[j]["wastedTime"]>=1 && legs[j]["wastedTime"]<=5 ){
                    itemStats["wastedTimeTotal"]=itemStats["wastedTimeTotal"]+legs[j]["wastedTime"];
                    itemStats["wastedTimeTotalCount"]=itemStats["wastedTimeTotalCount"]+1;
                }

                var valueFromTrip = legs[j]["valueFromTrip"];
                if(valueFromTrip==null || valueFromTrip.length!=4){
                    continue;
                }
                for(var h=0;h<valueFromTrip.length; h++){
                    if(valueFromTrip[h]["value"]>=0 && valueFromTrip[h]["value"]<=2){
                        itemStats["valueFromTripTotal"][h]["value"]=itemStats["valueFromTripTotal"][h]["value"]+valueFromTrip[h]["value"];
                        itemStats["valueFromTripTotalCount"][h]["count"]=itemStats["valueFromTripTotalCount"][h]["count"]+1;
                    }
                }
                var thirdValue = maxFromTwoValues(valueFromTrip[0]["value"],valueFromTrip[1]["value"]);
                if(thirdValue!=-1){
                    itemStats["valueFromTripTotal"][4]["value"]=itemStats["valueFromTripTotal"][4]["value"]+thirdValue;
                    itemStats["valueFromTripTotalCount"][4]["count"]=itemStats["valueFromTripTotalCount"][4]["count"]+1;
                }
            }
        }
    }
    for(var k=0;k<itemStats["correctedModes"].length;k++){
        itemStats["correctedModes"][k]["weightedSum"]=itemStats["correctedModes"][k]["duration"];
        if(itemStats["correctedModes"][k]["mode"]===-1){
            itemStats["correctedModes"].splice(k,1);
        }
    }
    return itemStats;
}

/**
 * Creates an user summary object (1day,3day,7day,30day,1y,ever)
 * @param {*} orientResult user trips
 * @param {*} userid
 */
var createUserSummary = function(orientResult,userid,callback){
    var results = []
    console.log("createUserSummary userid : "+userid);
    results[0]=JSON.parse(JSON.stringify(calculateUserGlobalStatsPerInterval(1,orientResult)));
    results[0]["dateType"]="day1"
    results[0]["userid"]=userid
    results[1]=JSON.parse(JSON.stringify(calculateUserGlobalStatsPerInterval(3,orientResult)));
    results[1]["dateType"]="day3"
    results[1]["userid"]=userid
    results[2]=JSON.parse(JSON.stringify(calculateUserGlobalStatsPerInterval(7,orientResult)));
    results[2]["dateType"]="day7"
    results[2]["userid"]=userid
    results[3]=JSON.parse(JSON.stringify(calculateUserGlobalStatsPerInterval(30,orientResult)));
    results[3]["dateType"]="day30"
    results[3]["userid"]=userid
    results[4]=JSON.parse(JSON.stringify(calculateUserGlobalStatsPerInterval(365,orientResult)));
    results[4]["dateType"]="day365"
    results[4]["userid"]=userid
    results[5]=JSON.parse(JSON.stringify(calculateUserGlobalStatsPerInterval(everTimeValue,orientResult)));
    results[5]["dateType"]="ever"
    results[5]["userid"]=userid
    return callback(null,results);
}

/**
 * UserGlobalStats mongo table
 */
var submitUserSummary = function(stats,userid,callback){
    if(stats.length==0){
        return callback(null);
    }
    var currStat=stats.shift();
    userSummaryStatsDB.findOneAndUpdate({"dateType":currStat.dateType,"userid":userid},currStat,{upsert:true},function(errorCheck){
        if(errorCheck){
            console.log("submitUserSummary error"+errorCheck);
            return callback(errorCheck);
        }
        else{
            return submitUserSummary(stats,userid,callback);}
    })
}

/**
 * Full process of calculating stats and submitting the results
 * @param {*} users users list
 */
var proccessUsersTrips=function(users,callback){
    if(users.length==0){
        return callback(null);
    }
    var currUser = users.shift();
    tripDB.find({"userid" : currUser["userid"]},{"tripid":1, "_id": 0,"startDate":1,"userid":1}, function(err, userTrips){
        if (err){
            console.log("proccessUsersTrips error : "+err);
            return callback(error);
        } else {
            removeDuplicatedTrips(userTrips);
            getUserTripsFromOrient(userTrips,function(orientError,result){
                if(orientError){
                    console.log("proccessUsersTrips error : "+orientError);
                    return callback(orientError);
                }
                else{
                   createUserSummary(result,currUser["userid"],function(error,userSummary){
                        if(error){
                            console.log("proccessUsersTrips error : "+error);
                            return callback(error);
                        }
                        else{
                            submitUserSummary(userSummary,currUser["userid"],function(errorCheck){
                                if(errorCheck){
                                    console.log("proccessUsersTrips error : "+errorCheck);
                                    return callback(errorCheck);
                                }
                                else{
                                    return proccessUsersTrips(users,callback);
                                }
                            })
                        }

                    })
                }
            });
        }
});
}

/**
 * External function to update user summaries (userglobal stats)
 */
module.exports.updateUserSummary = function(){
    usersDB.find({}, function (error, users){
        if (error){
            console.log('updateUserSummary: error ' + error);
            return;
        }
        proccessUsersTrips(users,function(error){
            if(error){
                console.log('updateUserSummary: error ' + error);
                return;
            }
            else{
                console.log('updateUserSummary: Success ');
            }
        })
    });
}

function addDays(date, days) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + days,
        0,
        0,
        0,
        0
    );
}

/**
 * Calculates globalstats/summary based on the time interval (nrDays - now)
 * @param {*} nrDays how many days in the past we want to calculate stats (define lower limit)
 * @param {*} result stats
 */
var proccessStatsByNrDays = function(nrDays,result){
    var ever = false;
    if(nrDays==-1 || nrDays>result.length){
        nrDays = everTimeValue;
        ever=true;
    }
    var limitLower = addDays(new Date(),-(nrDays+CURRENT_DAY));

    var limitHigher = addDays(new Date(),-(CURRENT_DAY));

    var auxStats = {};
    auxStats["valueFromTripTotal"]=[{"code":0,"value":0},{"code":1,"value":0},{"code":2,"value":0},{"code":3,"value":0},{"code":4,"value":0}];
    auxStats["valueFromTripTotalCount"]=[{"code":0,"count":0},{"code":1,"count":0},{"code":2,"count":0},{"code":3,"count":0},{"code":4,"count":0}];
    auxStats["correctedModes"]=[];
    auxStats["wastedTimeTotal"]=0;
    auxStats["wastedTimeTotalCount"]=0;
    auxStats["overallScoreCount"]=0;
    auxStats["overallScoreTotal"]=0;
    auxStats["totalDuration"]=0;
    auxStats["totalDistance"]=0;
    auxStats["totalLegs"]=0;
    auxStats["totalUsers"]=0;
    auxStats["date"]=limitLower.getTime()*1000;
    for(var h=0;h<result.length;h++){
        if(result[h]!=null && result[h]!=undefined){
            if((result[h]["date"]<limitLower.getTime()*1000 && !ever) || (result[h]["date"]>=limitHigher.getTime()*1000 && !ever)){
                continue;
            }
            auxStats["valueFromTripTotal"][0]["value"]=auxStats["valueFromTripTotal"][0]["value"]+result[h]["valueFromTripTotal"][0]["value"];
            auxStats["valueFromTripTotal"][1]["value"]=auxStats["valueFromTripTotal"][1]["value"]+result[h]["valueFromTripTotal"][1]["value"];
            auxStats["valueFromTripTotal"][2]["value"]=auxStats["valueFromTripTotal"][2]["value"]+result[h]["valueFromTripTotal"][2]["value"];
            auxStats["valueFromTripTotal"][3]["value"]=auxStats["valueFromTripTotal"][3]["value"]+result[h]["valueFromTripTotal"][3]["value"];
            auxStats["valueFromTripTotal"][4]["value"]=auxStats["valueFromTripTotal"][4]["value"]+result[h]["valueFromTripTotal"][4]["value"];
            auxStats["valueFromTripTotalCount"][0]["count"]=auxStats["valueFromTripTotalCount"][0]["count"]+result[h]["valueFromTripTotalCount"][0]["count"];
            auxStats["valueFromTripTotalCount"][1]["count"]=auxStats["valueFromTripTotalCount"][1]["count"]+result[h]["valueFromTripTotalCount"][1]["count"];
            auxStats["valueFromTripTotalCount"][2]["count"]=auxStats["valueFromTripTotalCount"][2]["count"]+result[h]["valueFromTripTotalCount"][2]["count"];
            auxStats["valueFromTripTotalCount"][3]["count"]=auxStats["valueFromTripTotalCount"][3]["count"]+result[h]["valueFromTripTotalCount"][3]["count"];
            auxStats["valueFromTripTotalCount"][4]["count"]=auxStats["valueFromTripTotalCount"][4]["count"]+result[h]["valueFromTripTotalCount"][4]["count"];
            auxStats["wastedTimeTotal"]=auxStats["wastedTimeTotal"]+result[h]["wastedTimeTotal"];
            auxStats["wastedTimeTotalCount"]=auxStats["wastedTimeTotalCount"]+result[h]["wastedTimeTotalCount"];
            auxStats["overallScoreCount"]=auxStats["overallScoreCount"]+result[h]["overallScoreCount"];
            auxStats["overallScoreTotal"]=auxStats["overallScoreTotal"]+result[h]["overallScoreTotal"];
            auxStats["totalDuration"]=auxStats["totalDuration"]+result[h]["totalDuration"];
            auxStats["totalDistance"]=auxStats["totalDistance"]+result[h]["totalDistance"];
            auxStats["totalLegs"]=auxStats["totalLegs"]+result[h]["totalLegs"];  
            auxStats["totalUsers"]=auxStats["totalUsers"]+result[h]["totalUsers"];
            for(var j=0;j<result[h]["correctedModes"].length;j++){
                var addedMode = false;
                for(var i=0; i<auxStats["correctedModes"].length;i++){
                    if(result[h]["correctedModes"][j]["mode"]==auxStats["correctedModes"][i]["mode"]){
                        auxStats["correctedModes"][i]["distance"]=auxStats["correctedModes"][i]["distance"]+result[h]["correctedModes"][j]["distance"];
                        auxStats["correctedModes"][i]["duration"]=auxStats["correctedModes"][i]["duration"]+result[h]["correctedModes"][j]["duration"];
                        auxStats["correctedModes"][i]["count"]=auxStats["correctedModes"][i]["count"]+result[h]["correctedModes"][j]["count"];
                        auxStats["correctedModes"][i]["valueFromTripMode"][0]["value"]=auxStats["correctedModes"][i]["valueFromTripMode"][0]["value"]+result[h]["correctedModes"][j]["valueFromTripMode"][0]["value"];
                        auxStats["correctedModes"][i]["valueFromTripMode"][1]["value"]=auxStats["correctedModes"][i]["valueFromTripMode"][1]["value"]+result[h]["correctedModes"][j]["valueFromTripMode"][1]["value"];
                        auxStats["correctedModes"][i]["valueFromTripMode"][2]["value"]=auxStats["correctedModes"][i]["valueFromTripMode"][2]["value"]+result[h]["correctedModes"][j]["valueFromTripMode"][2]["value"];
                        auxStats["correctedModes"][i]["valueFromTripMode"][3]["value"]=auxStats["correctedModes"][i]["valueFromTripMode"][3]["value"]+result[h]["correctedModes"][j]["valueFromTripMode"][3]["value"];
                        auxStats["correctedModes"][i]["valueFromTripMode"][4]["value"]=auxStats["correctedModes"][i]["valueFromTripMode"][4]["value"]+result[h]["correctedModes"][j]["valueFromTripMode"][4]["value"];
                        auxStats["correctedModes"][i]["valueFromTripModeCount"][0]["count"]=auxStats["correctedModes"][i]["valueFromTripModeCount"][0]["count"]+result[h]["correctedModes"][j]["valueFromTripModeCount"][0]["count"];
                        auxStats["correctedModes"][i]["valueFromTripModeCount"][1]["count"]=auxStats["correctedModes"][i]["valueFromTripModeCount"][1]["count"]+result[h]["correctedModes"][j]["valueFromTripModeCount"][1]["count"];
                        auxStats["correctedModes"][i]["valueFromTripModeCount"][2]["count"]=auxStats["correctedModes"][i]["valueFromTripModeCount"][2]["count"]+result[h]["correctedModes"][j]["valueFromTripModeCount"][2]["count"];
                        auxStats["correctedModes"][i]["valueFromTripModeCount"][3]["count"]=auxStats["correctedModes"][i]["valueFromTripModeCount"][3]["count"]+result[h]["correctedModes"][j]["valueFromTripModeCount"][3]["count"];
                        auxStats["correctedModes"][i]["valueFromTripModeCount"][4]["count"]=auxStats["correctedModes"][i]["valueFromTripModeCount"][4]["count"]+result[h]["correctedModes"][j]["valueFromTripModeCount"][4]["count"];
                        auxStats["correctedModes"][i]["valueFromTripModeWSum"][0]["value"]=auxStats["correctedModes"][i]["valueFromTripModeWSum"][0]["value"]+result[h]["correctedModes"][j]["valueFromTripModeWSum"][0]["value"];
                        auxStats["correctedModes"][i]["valueFromTripModeWSum"][1]["value"]=auxStats["correctedModes"][i]["valueFromTripModeWSum"][1]["value"]+result[h]["correctedModes"][j]["valueFromTripModeWSum"][1]["value"];
                        auxStats["correctedModes"][i]["valueFromTripModeWSum"][2]["value"]=auxStats["correctedModes"][i]["valueFromTripModeWSum"][2]["value"]+result[h]["correctedModes"][j]["valueFromTripModeWSum"][2]["value"];
                        auxStats["correctedModes"][i]["valueFromTripModeWSum"][3]["value"]=auxStats["correctedModes"][i]["valueFromTripModeWSum"][3]["value"]+result[h]["correctedModes"][j]["valueFromTripModeWSum"][3]["value"];
                        auxStats["correctedModes"][i]["valueFromTripModeWSum"][4]["value"]=auxStats["correctedModes"][i]["valueFromTripModeWSum"][4]["value"]+result[h]["correctedModes"][j]["valueFromTripModeWSum"][4]["value"];
                        auxStats["correctedModes"][i]["wastedTimeMode"]=auxStats["correctedModes"][i]["wastedTimeMode"]+result[h]["correctedModes"][j]["wastedTimeMode"];
                        auxStats["correctedModes"][i]["wastedTimeModeCount"]=auxStats["correctedModes"][i]["wastedTimeModeCount"]+result[h]["correctedModes"][j]["wastedTimeModeCount"];
                        auxStats["correctedModes"][i]["weightedSum"]=auxStats["correctedModes"][i]["weightedSum"]+result[h]["correctedModes"][j]["weightedSum"];
                        auxStats["correctedModes"][i]["wastedTimeWSum"]=auxStats["correctedModes"][i]["wastedTimeWSum"]+result[h]["correctedModes"][j]["wastedTimeWSum"];
                        addedMode=true;
                        break;
                    }
                }
                if(!addedMode){
                    var copyCorrectedMode = JSON.parse(JSON.stringify(result[h]["correctedModes"][j]));
                    auxStats["correctedModes"].push(copyCorrectedMode);
                }
            }

        }
    }
    for(var p=0;p<auxStats["correctedModes"].length;p++){
        if(auxStats["correctedModes"][p]["mode"]===-1){
            auxStats["correctedModes"].splice(p,1);
        }
    }
    return auxStats;
}

/**
 * Builds summary for city (1d,3d,7d,30d,1y,ever)
 * @param {*} city 
 * @param {*} callback 
 */
var getStatsByCity = function(city,callback){
    cityStatsDB.find({"city" : city}, function (error, result){
        if(error){
            console.log("getStatsByCity error : "+error);
            callback(error,null);
        }
        else{
            var entries = [];
            entries[0]=JSON.parse(JSON.stringify(proccessStatsByNrDays(1,result)));
            entries[0].dateType="day1"
            entries[0].name=city
            entries[0].geoType="city";

            entries[1]=JSON.parse(JSON.stringify(proccessStatsByNrDays(3,result)));
            entries[1].dateType="day3"
            entries[1].name=city
            entries[1].geoType="city"

            entries[2]=JSON.parse(JSON.stringify(proccessStatsByNrDays(7,result)));
            entries[2].dateType="day7"
            entries[2].name=city
            entries[2].geoType="city"

            entries[3]=JSON.parse(JSON.stringify(proccessStatsByNrDays(30,result)));
            entries[3].dateType="day30"
            entries[3].name=city
            entries[3].geoType="city"

            entries[4]=JSON.parse(JSON.stringify(proccessStatsByNrDays(365,result)));
            entries[4].dateType="day365"
            entries[4].name=city
            entries[4].geoType="city"

            entries[5]=JSON.parse(JSON.stringify(proccessStatsByNrDays(-1,result)));
            entries[5].dateType="ever"
            entries[5].name=city
            entries[5].geoType="city"
            return callback(null,entries);

        }
    }).sort({"date" : -1});
}
/**
 * Builds summary for campaign (1d,3d,7d,30d,1y,ever)
 * @param {*} campaign 
 */
var getStatsByCampaign = function(campaign,callback){
    campaignStatsDB.find({ "campaignid" : campaign}, function (error, result){
        if(error){
            console.log("getStatsByCampaign error : "+error);
            callback(error,null);
        }
        else{
            var entries = [];
            entries[0]=JSON.parse(JSON.stringify(proccessStatsByNrDays(1,result)));
            entries[0].dateType="day1"
            entries[0].name=campaign
            entries[0].geoType="campaign";

            entries[1]=JSON.parse(JSON.stringify(proccessStatsByNrDays(3,result)));
            entries[1].dateType="day3"
            entries[1].name=campaign
            entries[1].geoType="campaign"

            entries[2]=JSON.parse(JSON.stringify(proccessStatsByNrDays(7,result)));
            entries[2].dateType="day7"
            entries[2].name=campaign
            entries[2].geoType="campaign"

            entries[3]=JSON.parse(JSON.stringify(proccessStatsByNrDays(30,result)));
            entries[3].dateType="day30"
            entries[3].name=campaign
            entries[3].geoType="campaign"

            entries[4]=JSON.parse(JSON.stringify(proccessStatsByNrDays(365,result)));
            entries[4].dateType="day365"
            entries[4].name=campaign
            entries[4].geoType="campaign"

            entries[5]=JSON.parse(JSON.stringify(proccessStatsByNrDays(-1,result)));
            entries[5].dateType="ever"
            entries[5].name=campaign
            entries[5].geoType="campaign"

            return callback(null,entries);

        }
    }).sort({"date" : -1});
}

var insertItemSummaryBD=function(stats,geoType,callback){
    if(stats.length===0){
        return callback(null);
    }
    var currStat = stats.shift();
    summaryStatsDB.findOneAndUpdate({"dateType":currStat.dateType,"geoType":geoType,"name":currStat.name},currStat,{upsert:true},function(errorCheck){
        if(errorCheck){
            console.log("insertItemSummaryBD error: "+errorCheck);
            return callback(true);
        }
        else{
            return insertItemSummaryBD(stats,geoType,callback);}
    })

}

/**
 * Recursive function to update a list of campaigns (summaries) in the bd
 * @param {*} result 
 */
var updateSummaryCampaignsIteration = function(result,callback){
    if(result.length===0){
        return callback(null);
    }
    var currCampaign=result.shift();
    getStatsByCampaign(currCampaign["_id"],function(errorCheck,stats){
        if(errorCheck){
            console.log("updateSummaryStatsCampaigns error 1 ");
            return callback(true);
        }
        else{
            insertItemSummaryBD(stats,"campaign",function(errorCheck){
                if(errorCheck){
                    console.log("updateSummaryStatsCampaigns error 2");
                    return callback(true);
                }
                else{
                    console.log("Inserted campaign: "+currCampaign["_id"]);
                    return updateSummaryCampaignsIteration(result,callback);
                }
            })
        }
    })
}
/**
 * gets the list of campaigns and calls updateSummaryCampaignsIteration 
 */
var updateSummaryStatsCampaigns = function(callback){
    campaignDb.find({},{"_id" : 1.0},function(errorCheck,result){
        if(errorCheck){
            console.log("updateSummaryStatsCampaigns error 4 ");
            return callback(true);
        }
        else{
            updateSummaryCampaignsIteration(result,function(errorCheck){
                if(errorCheck){
                    console.log("updateSummaryStatsCampaigns error 5 ");
                    return callback(true);
                }
                else{
                    console.log("updateSummaryCampaignsIteration success");
                    return callback(null);
                }
            })
        }
    })
}

/**
 * Updates summary table for all the countries, cities and campaigns
 * @param {*} countryCityList 
 */
var updateSummaryTableFunc = function(countryCityList){
    var updateCountryCity=function(countryCityList,callback){
        if(countryCityList.length===0){
            return callback(null);
        }
        var currCountry=countryCityList.shift();
        
        updateCountry(currCountry,function(errorCheck){
            if(errorCheck){
                console.log("country + "+currCountry["name"]+ " -> error summary update");
                return callback(true);
            }
            else{
                console.log("Country "+currCountry["name"]+" successfull update");
                return updateCountryCity(countryCityList,callback);
            }
        }
        )}
    updateCountryCity(countryCityList,function(errorCheck){
        if(errorCheck){
            console.log("error updateCountryCity");
            return;
        }
        else{
            updateSummaryStatsCampaigns(function(errorCheck){
                if(errorCheck){
                    console.log("updateSummaryStatsCampaigns error 3");
                    return;
                }
            })
        }
    });
}

module.exports.updateSummaryTable = updateSummaryTableFunc;

/**
 * Accumulates city summary stats to build country stats
 * @param {*} citiesStats 
 * @param {*} arg represents the type of time interval (1 day, 3 days, 1 week ...)
 * ex: country[1week] = city1[1week] + city2[1week] ...
 */
var buildStatsDay=function(citiesStats,arg){
    var auxStats = {};
    auxStats["valueFromTripTotal"]=[{"code":0,"value":0},{"code":1,"value":0},{"code":2,"value":0},{"code":3,"value":0},{"code":4,"value":0}];
    auxStats["valueFromTripTotalCount"]=[{"code":0,"count":0},{"code":1,"count":0},{"code":2,"count":0},{"code":3,"count":0},{"code":4,"count":0}];
    auxStats["correctedModes"]=[];
    auxStats["wastedTimeTotal"]=0;
    auxStats["wastedTimeTotalCount"]=0;
    auxStats["overallScoreCount"]=0;
    auxStats["overallScoreTotal"]=0;
    auxStats["totalDuration"]=0;
    auxStats["totalDistance"]=0;
    auxStats["totalLegs"]=0;
    auxStats["totalUsers"]=0;
    for(var i=0;i<citiesStats.length;i++){
        auxStats["date"]=citiesStats[i][arg]["date"];
        auxStats["valueFromTripTotal"][0]["value"]=auxStats["valueFromTripTotal"][0]["value"]+citiesStats[i][arg]["valueFromTripTotal"][0]["value"];
        auxStats["valueFromTripTotal"][1]["value"]=auxStats["valueFromTripTotal"][1]["value"]+citiesStats[i][arg]["valueFromTripTotal"][1]["value"];
        auxStats["valueFromTripTotal"][2]["value"]=auxStats["valueFromTripTotal"][2]["value"]+citiesStats[i][arg]["valueFromTripTotal"][2]["value"];
        auxStats["valueFromTripTotal"][3]["value"]=auxStats["valueFromTripTotal"][3]["value"]+citiesStats[i][arg]["valueFromTripTotal"][3]["value"];
        auxStats["valueFromTripTotal"][4]["value"]=auxStats["valueFromTripTotal"][4]["value"]+citiesStats[i][arg]["valueFromTripTotal"][4]["value"];
        auxStats["valueFromTripTotalCount"][0]["count"]=auxStats["valueFromTripTotalCount"][0]["count"]+citiesStats[i][arg]["valueFromTripTotalCount"][0]["count"];
        auxStats["valueFromTripTotalCount"][1]["count"]=auxStats["valueFromTripTotalCount"][1]["count"]+citiesStats[i][arg]["valueFromTripTotalCount"][1]["count"];
        auxStats["valueFromTripTotalCount"][2]["count"]=auxStats["valueFromTripTotalCount"][2]["count"]+citiesStats[i][arg]["valueFromTripTotalCount"][2]["count"];
        auxStats["valueFromTripTotalCount"][3]["count"]=auxStats["valueFromTripTotalCount"][3]["count"]+citiesStats[i][arg]["valueFromTripTotalCount"][3]["count"];
        auxStats["valueFromTripTotalCount"][4]["count"]=auxStats["valueFromTripTotalCount"][4]["count"]+citiesStats[i][arg]["valueFromTripTotalCount"][4]["count"];
        auxStats["wastedTimeTotal"]=auxStats["wastedTimeTotal"]+citiesStats[i][arg]["wastedTimeTotal"];
        auxStats["wastedTimeTotalCount"]=auxStats["wastedTimeTotalCount"]+citiesStats[i][arg]["wastedTimeTotalCount"];
        auxStats["overallScoreCount"]=auxStats["overallScoreCount"]+citiesStats[i][arg]["overallScoreCount"];
        auxStats["overallScoreTotal"]=auxStats["overallScoreTotal"]+citiesStats[i][arg]["overallScoreTotal"];
        auxStats["totalDuration"]=auxStats["totalDuration"]+citiesStats[i][arg]["totalDuration"];
        auxStats["totalDistance"]=auxStats["totalDistance"]+citiesStats[i][arg]["totalDistance"];
        auxStats["totalLegs"]=auxStats["totalLegs"]+citiesStats[i][arg]["totalLegs"];
        auxStats["totalUsers"]=auxStats["totalUsers"]+citiesStats[i][arg]["totalUsers"];
        for(var j=0;j<citiesStats[i][arg]["correctedModes"].length;j++){
            var addedMode = false;
            for(var l=0; l<auxStats["correctedModes"].length;l++){
                if(citiesStats[i][arg]["correctedModes"][j]["mode"]===auxStats["correctedModes"][l]["mode"]){
                    auxStats["correctedModes"][l]["distance"]=auxStats["correctedModes"][l]["distance"]+citiesStats[i][arg]["correctedModes"][j]["distance"];
                    auxStats["correctedModes"][l]["duration"]=auxStats["correctedModes"][l]["duration"]+citiesStats[i][arg]["correctedModes"][j]["duration"];
                    auxStats["correctedModes"][l]["count"]=auxStats["correctedModes"][l]["count"]+citiesStats[i][arg]["correctedModes"][j]["count"];
                    auxStats["correctedModes"][l]["valueFromTripMode"][0]["value"]=auxStats["correctedModes"][l]["valueFromTripMode"][0]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripMode"][0]["value"];
                    auxStats["correctedModes"][l]["valueFromTripMode"][1]["value"]=auxStats["correctedModes"][l]["valueFromTripMode"][1]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripMode"][1]["value"];
                    auxStats["correctedModes"][l]["valueFromTripMode"][2]["value"]=auxStats["correctedModes"][l]["valueFromTripMode"][2]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripMode"][2]["value"];
                    auxStats["correctedModes"][l]["valueFromTripMode"][3]["value"]=auxStats["correctedModes"][l]["valueFromTripMode"][3]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripMode"][3]["value"];
                    auxStats["correctedModes"][l]["valueFromTripMode"][4]["value"]=auxStats["correctedModes"][l]["valueFromTripMode"][4]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripMode"][4]["value"];
                    auxStats["correctedModes"][l]["valueFromTripModeWSum"][0]["value"]=auxStats["correctedModes"][l]["valueFromTripModeWSum"][0]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeWSum"][0]["value"];
                    auxStats["correctedModes"][l]["valueFromTripModeWSum"][1]["value"]=auxStats["correctedModes"][l]["valueFromTripModeWSum"][1]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeWSum"][1]["value"];
                    auxStats["correctedModes"][l]["valueFromTripModeWSum"][2]["value"]=auxStats["correctedModes"][l]["valueFromTripModeWSum"][2]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeWSum"][2]["value"];
                    auxStats["correctedModes"][l]["valueFromTripModeWSum"][3]["value"]=auxStats["correctedModes"][l]["valueFromTripModeWSum"][3]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeWSum"][3]["value"];
                    auxStats["correctedModes"][l]["valueFromTripModeWSum"][4]["value"]=auxStats["correctedModes"][l]["valueFromTripModeWSum"][4]["value"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeWSum"][4]["value"];
                    auxStats["correctedModes"][l]["valueFromTripModeCount"][0]["count"]=auxStats["correctedModes"][l]["valueFromTripModeCount"][0]["count"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeCount"][0]["count"];
                    auxStats["correctedModes"][l]["valueFromTripModeCount"][1]["count"]=auxStats["correctedModes"][l]["valueFromTripModeCount"][1]["count"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeCount"][1]["count"];
                    auxStats["correctedModes"][l]["valueFromTripModeCount"][2]["count"]=auxStats["correctedModes"][l]["valueFromTripModeCount"][2]["count"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeCount"][2]["count"];
                    auxStats["correctedModes"][l]["valueFromTripModeCount"][3]["count"]=auxStats["correctedModes"][l]["valueFromTripModeCount"][3]["count"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeCount"][3]["count"];
                    auxStats["correctedModes"][l]["valueFromTripModeCount"][4]["count"]=auxStats["correctedModes"][l]["valueFromTripModeCount"][4]["count"]+citiesStats[i][arg]["correctedModes"][j]["valueFromTripModeCount"][4]["count"];
                    auxStats["correctedModes"][l]["wastedTimeMode"]=auxStats["correctedModes"][l]["wastedTimeMode"]+citiesStats[i][arg]["correctedModes"][j]["wastedTimeMode"];
                    auxStats["correctedModes"][l]["wastedTimeModeCount"]=auxStats["correctedModes"][l]["wastedTimeModeCount"]+citiesStats[i][arg]["correctedModes"][j]["wastedTimeModeCount"];
                    auxStats["correctedModes"][l]["weightedSum"]=auxStats["correctedModes"][l]["weightedSum"]+citiesStats[i][arg]["correctedModes"][j]["weightedSum"];
                    auxStats["correctedModes"][l]["wastedTimeWSum"]=auxStats["correctedModes"][l]["wastedTimeWSum"]+citiesStats[i][arg]["correctedModes"][j]["wastedTimeWSum"];
                    addedMode = true;
                    break;
                }
            }
            if(!addedMode){
                var copyCorrectedMode = JSON.parse(JSON.stringify(citiesStats[i][arg]["correctedModes"][j]));
                auxStats["correctedModes"].push(copyCorrectedMode);
            }
        }
    }
    return auxStats;
}
/**
 * Updates country stats for a list of countries ( recursive )
 * @param {*} entries item containing country name and datetype
 */
var submitEntryStatsSummary = function(entries,callback){
    if(entries.length===0){
        console.log("Country updated successfully");
        return callback(null);
    }
    var entry = entries.shift();
    summaryStatsDB.findOneAndUpdate({"dateType":entry.dateType,"geoType":"country","name":entry.name},entry,{upsert:true},function(errorCheck){
        if(errorCheck){
            console.log("submitEntryStatsSummary error");
            return callback(true);
        }
        else{
            return submitEntryStatsSummary(entries,callback);
        }
    })
}

/**
 * Calculates summary country stats based on a list of city stats and updates the bd
 * @param {*} countryName 
 * @param {*} citiesStats 
 */
var buildAndSubmitCountryStats= function(countryName,citiesStats,callback){
    var entryList = []
    entryList[0]=JSON.parse(JSON.stringify(buildStatsDay(citiesStats,0)));
    entryList[0].dateType="day1";
    entryList[0].name=countryName;
    entryList[0].geoType="country";

    entryList[1]=JSON.parse(JSON.stringify(buildStatsDay(citiesStats,1)));
    entryList[1].dateType="day3";
    entryList[1].name=countryName;
    entryList[1].geoType="country";

    entryList[2]=JSON.parse(JSON.stringify(buildStatsDay(citiesStats,2)));
    entryList[2].dateType="day7";
    entryList[2].name=countryName;
    entryList[2].geoType="country";

    entryList[3]=JSON.parse(JSON.stringify(buildStatsDay(citiesStats,3)));
    entryList[3].dateType="day30";
    entryList[3].name=countryName;
    entryList[3].geoType="country";

    entryList[4]=JSON.parse(JSON.stringify(buildStatsDay(citiesStats,4)));
    entryList[4].dateType="day365";
    entryList[4].name=countryName;
    entryList[4].geoType="country";

    entryList[5]=JSON.parse(JSON.stringify(buildStatsDay(citiesStats,5)));
    entryList[5].dateType="ever";
    entryList[5].name=countryName;
    entryList[5].geoType="country";

    submitEntryStatsSummary(entryList,function(errorCheck){
        if(errorCheck){
            return callback(true);
        }
        else{
            return callback(null)
        }
        });  
}

//loop to insert stats of each city into the db
var insertCitySummaryBD = function(stats,callback){
    if(stats.length===0){
        return callback(null);
    }
    var city = stats.shift();
    insertItemSummaryBD(city,"city",function(errorCheck){
        if(errorCheck){
            console.log("-- insertItemSummaryBD: error "+city);
            return callback(true);
        }
        else{
            return insertCitySummaryBD(stats,callback);
        }
    });
}

/**
 * Iterates and accumulates stats from all the cities of a certain country and updates the country entry in the db
 * @param {*} country 
 */
var updateCountry = function(country,callback){
    var countryName=country["name"];
    var cities=country["cities"];
    var getStatsByCityIteration=function(cities,citiesStats,callback){
        if(cities.length===0){
            return callback(null,citiesStats);
        }
        var city=cities.shift();
        getStatsByCity(city,function(errorCheck,cityStats){
            if(errorCheck){
                console.log("-- getStatsByCity: error "+city);
                return callback(errorCheck,null);
            }
            citiesStats.push(cityStats);
            return getStatsByCityIteration(cities,citiesStats,callback);
        })
    }
    getStatsByCityIteration(cities,[],function(errorCheck,citiesStats){
        if(errorCheck){
            console.log("-- getStatsByCityIteration: error "+countryName);
            return;
        }
        else{
            //copy content to another variable
            var citiesStatsCopy = JSON.parse(JSON.stringify(citiesStats));
            insertCitySummaryBD(citiesStats,function(errorCheck){
                if(errorCheck){
                    console.log("-- insertCitySummaryBD: error "+countryName);
                    return;
                }
                else{
                    buildAndSubmitCountryStats(countryName,citiesStatsCopy,function(errorCheck){
                        if(errorCheck){
                            console.log("-- buildAndSubmitCountryStats: error "+countryName)
                            return callback(true);
                        }
                        else{
                            callback(null);
                        }
                    });
                }
            })
        }
    });
}

/**
 * Joins all the stats into one json to send (campaigns,city,user)
 * @param {*} stats stats of the campaigns, city, country
 * @param {*} userSummary user stats
 */
var proccessStatsAndSend = function(stats,userSummary,callback){
    var statsToSend = {};
    var campaigns = stats["campaigns"];
    var tempObjectCity = {};
    var tempObjectCountry = {};
    var tempObjectCampaigns = {};
    for(var i=0; i<stats["countryCity"].length;i++){
        if(stats["countryCity"][i]["geoType"]=="country"){
            tempObjectCountry[stats["countryCity"][i]["dateType"]]=stats["countryCity"][i];
            continue;
        }
        if(stats["countryCity"][i]["geoType"]=="city"){
            tempObjectCity[stats["countryCity"][i]["dateType"]]=stats["countryCity"][i];
            continue;
        }
        
    }
    statsToSend["city"]=tempObjectCity;
    statsToSend["country"]=tempObjectCountry;
    for(var i=0; i<campaigns.length;i++){
        if (campaigns[i] === undefined || campaigns[i] === null || campaigns[i] === [] || campaigns[i] === {} ||
            campaigns[i][0] === undefined || campaigns[i][0] === null || campaigns[i][0] === [] || campaigns[i][0] === {} ) {
            console.log("error empty campaigns objects");
            continue;
        }      
        tempObjectCampaigns[campaigns[i][0]["name"]]={};
        for(var h=0; h<campaigns[i].length;h++){
            tempObjectCampaigns[campaigns[i][h]["name"]][campaigns[i][h]["dateType"]]=campaigns[i][h];
        }
    }
    statsToSend["campaigns"]=tempObjectCampaigns;

    statsToSend["user"]={}
    for(var i=0; i<userSummary.length;i++){
        statsToSend["user"][userSummary[i]["dateType"]]=userSummary[i];
    }

    callback(null,statsToSend);
}

/**
 * Recursive function to gather stats from every campaign of the user
 * @param {*} campaigns user list of campaigns
 * @param {*} campaignsStats item that will gather stats from all the campaigns
 */
var getSummaryStatsCampaigns = function(campaigns,campaignsStats,callback){
    if(campaigns.length===0){
        return callback(null,campaignsStats);
    }
    var currCampaign=campaigns.shift();
    summaryStatsDB.find({"geoType" : "campaign", "name" : currCampaign},function(errorCheck,result){
        if(errorCheck){
            console.log("-- getSummaryStatsCampaigns: error: "+error);
            return callback(errorCheck,null);
        }
        else{
            campaignsStats.push(result);
            return getSummaryStatsCampaigns(campaigns,campaignsStats,callback);
        }
    }
    ).sort({"date" : -1});
}

/**
 * @returns stats for user, user campaigns, user city and country
 */
module.exports.getStats = function (req, res) {
    var stats = {};
    usersDB.find({"userid":req.tokenDecoded.uid},{"onCampaigns" : 1, "userSettings.city" : 1,"userSettings.country" : 1}, function (error, result){
        if(error){
            res.status(500).json(error);
            console.log("-- getStats: error -> uid "+req.tokenDecoded.uid+" error: "+error);
            return;
        }
        else{
            if(result==undefined || result==null || result.length<1){
                res.status(500).json(error);
                console.log("-- getStats: error -> uid "+req.tokenDecoded.uid+" error: "+error);
                return;
            }
            else{
                summaryStatsDB.find({"$or" : [{"$and" : [{"geoType" : "city"}, {"name" : result[0]["userSettings"]["city"]}]},{"$and" : [{"geoType" : "country"},{"name" : result[0]["userSettings"]["country"]}]}]},function(errorCheck,cityAndCountryStats){
                    if(errorCheck){
                        console.log("-- getStats: error -> uid "+req.tokenDecoded.uid+" error: "+error);
                        res.status(500).json(error);
                        return;
                    }
                    else{
                        stats["countryCity"]=cityAndCountryStats;
                        getSummaryStatsCampaigns(result[0]["onCampaigns"],[],function(errorCheck,statsCampaigns){
                            if(errorCheck){
                                console.log("-- getStats: error -> uid "+req.tokenDecoded.uid+" error: "+error);
                                res.status(500).json(error);
                                return;
                            }
                            stats["campaigns"]=statsCampaigns;
                            userSummaryStatsDB.find({"userid":req.tokenDecoded.uid}, function (error, userSummary){
                                if(error){
                                    console.log("-- getStats: error -> uid "+req.tokenDecoded.uid+" error: "+error);
                                    res.status(500).json(error);
                                    return;
                                }
                                else{
                                    proccessStatsAndSend(stats,userSummary,function(errorCheck,statsFinal){
                                    if(errorCheck){
                                        console.log("-- getStats: error -> uid "+req.tokenDecoded.uid+" error: "+error);
                                        return;
                                    }
                                    else{
                                        res.status(200).json(statsFinal);
                                        console.log("-- getStats: -> uid "+req.tokenDecoded.uid+" success!");
                                        return;
                                    }
                                });
                                }
        
                            })

                        })
                    }
                })
            }            
        }
    });
};