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
 * Rewards Controller 
 * 
 * Rewards can be attributed to campaigns (campaign.js). 
 * Users can benefit from these rewards which are defined by the Campaign Managers
 * There are three kinds of rewards:
 * - based on number of trips;
 * - based on number of days with trips;
 * - based on points (these points can be adquired from answering surveys)
 */
var mongoose = require('mongoose');
var databases = require('../models/databases');

var campaignCollection= databases.campaignDbConnection.model('campaign');
var rewardCollection = databases.campaignDbConnection.model('reward');
var rewardStatusCollection = databases.campaignDbConnection.model('rewardStatus');
var usersCollection = mongoose.model('User');
var validator = require('../validators/validator');
var usersConstroller = require('./users');
var userStatsDB = mongoose.model('UserStats');

/**
 * Builds a response using a @param reward
 */
var responseFromReward = function(reward) {
    var rewardToReturn = {
        "rewardId": reward._id,
        "rewardName": reward.rewardName,
        "targetCampaignId": reward.targetCampaignId,
        "startDate": reward.startDate,
        "endDate": reward.endDate,
        "targetType": reward.targetType,
        "targetValue": reward.targetValue,
        "organizerName": reward.organizerName,
        "linkToContact": reward.linkToContact,
        "removed": reward.removed,
        "defaultLanguage": reward.defaultLanguage,
        "descriptions" : reward.descriptions
    };
    return rewardToReturn;
};

/**
 * Creates a reward
 * 
 * @param req.body contains a reward object
 */
module.exports.createNewReward = function (req, res) {
    var reward = req.body;
    if (!validator.validate.REWARD(reward)){
        console.log('-- createNewReward: Validator Error - ', validator.validate.REWARD.errors);
        console.log('-- createNewReward: Invalid Body - ', reward);
        res.status(400).json({"error" : validator.validate.REWARD.errors});
        return;
    }
    rewardCollection.create(reward, function(errCreateReward, createdReward){
        if (errCreateReward){
            console.log('-- createNewReward: mongodb error: ' + errCreateReward);
            res.status(500).json(errCreateReward);
            return;
        }
        res.status(200).json({"status": "reward created!"});
    });
};

/**
 * Get campaigns ids with active reward
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getCampaignIdsWithActiveReward = function (req, res) {
    var currTimestamp = Date.now();
    var query = {
        "removed": false,
        "endDate": {$gt: currTimestamp}     // endDate is in the future, meaning that campaign has reward defined
    };
    var projection = {"_id": 0, "targetCampaignId": 1};
    rewardCollection.find(query, projection, function(errQuery, rewards){
        if (errQuery) {
            console.log('-- getCampaignIdsWithActiveReward: mongodb error: ' + errQuery);
            res.status(500).json(errQuery);
            return;
        }
        var campaignsWithActiveReward = [];
        rewards.forEach(reward => {
            campaignsWithActiveReward.push(reward.targetCampaignId);
        })
        res.status(200).json(campaignsWithActiveReward);
    });
};

/**
 * Get my rewards
 * 
 * @param req.tokenDecoded.uid userid
 * @return list of rewards
 */
module.exports.getMyRewards = function (req, res) {
    const userid = req.tokenDecoded.uid;
    const queryUser = {"userid": userid};
    const projectionUser = {"_id": 0, "onCampaigns": 1};
    console.log("getMyRewards userid: "+userid);
    usersCollection.findOne(queryUser, projectionUser, function(errQueryUser, userWithCampaigns){
        if (errQueryUser) {
            console.log('-- getMyRewards: mongodb error: ' + errQueryUser);
            res.status(500).json(errQueryUser);
            return;
        }
        if(userWithCampaigns && userWithCampaigns.onCampaigns ){
            console.log("-- getMyRewards: num of campaigns test OK");       
        } else {
            console.log("-- getMyRewards: num of campaigns test NOT OK will crash");
            res.status(500).json("userid: "+userid+" with empty campaigns");    
            return;   
        } 
        console.log("-- getMyRewards: num of campaigns = ", userWithCampaigns.onCampaigns.length);        
        const queryRewards = {"targetCampaignId": {$in: userWithCampaigns.onCampaigns}};
        rewardCollection.find(queryRewards, function(errQueryRewards, rewardsOfUser){
            if (errQueryRewards) {
                console.log('-- getMyRewards: mongodb error: ' + errQueryRewards);
                res.status(500).json(errQueryRewards);
                return;
            }
            console.log("-- getMyRewards: num of rewards = ", rewardsOfUser.length);
            var rewardsToReturn = [];
            rewardsOfUser.forEach( reward => {
                rewardsToReturn.push(responseFromReward(reward));
            });
            res.status(200).json(rewardsToReturn);
        });
    });
};

/**
 * Updates all time reward status for a certain user
 * 
 * @param req.tokenDecoded.uid userid
 * @param req.body list of rewardsstatus
 */
module.exports.updateRewardStatusAllTime = function (req, res) {
    const userid = req.tokenDecoded.uid;
    var listOfRewardStatus = req.body;
    // recursive internal function:
    var findExistingAndNewRewards = function (rewardsStatusToCheck, rewardsStatusToReturn, callback) {
        if (rewardsStatusToCheck.length === 0){
            return callback(null, rewardsStatusToReturn);
        } else {
            var currRewardStatus = rewardsStatusToCheck.shift();                 // pop
            currRewardStatus["userid"] = userid;
            var queryFindIfExists = {"userid": userid, "rewardID": currRewardStatus.rewardID};
            rewardStatusCollection.findOne(queryFindIfExists, function(errFind, existentRewardStatus){
                if (errFind) {
                    console.log('-- updateRewardStatusAllTime: mongodb error: ' + errFind);
                    return callback(errFind, null);
                }
                if (existentRewardStatus){    // rewardStatus already exists
                    if (currRewardStatus.rewardVersion >= existentRewardStatus.rewardVersion){  // new version will be updated, older versions are ignored
                        rewardsStatusToReturn["rsToRefresh"].push(currRewardStatus);
                    }
                } else {                    // rewardStatus is new  
                    rewardsStatusToReturn["rsToCreate"].push(currRewardStatus);
                }
                return findExistingAndNewRewards(rewardsStatusToCheck, rewardsStatusToReturn, callback);
            });
        }
    };
    // recursive internal function:
    var updateRewardStatus = function(rsToUpdate, callback) {
        if (rsToUpdate["rsToRefresh"].length === 0 && rsToUpdate["rsToCreate"].length === 0){
            // after update all, query to get all rewardStatus
            return callback(null, {"status": "all rewards updated"});
        } else {
            if (rsToUpdate["rsToRefresh"].length > 0){
                var currRsToRefresh = rsToUpdate["rsToRefresh"].shift();                 // pop
                var queryUpdateExisting = {"userid": userid, "rewardID": currRsToRefresh.rewardID};
                rewardStatusCollection.findOneAndUpdate(queryUpdateExisting, currRsToRefresh, function(errUpdateExisting, oldRs){
                    if (errUpdateExisting){
                        console.log('-- updateRewardStatusAllTime: mongodb error: ' + errUpdateExisting);
                        return callback(errUpdateExisting, null);
                    }
                    return updateRewardStatus(rsToUpdate, callback);
                });
            }
            else {
                var currRsToCreate = rsToUpdate["rsToCreate"].shift();                 // pop
                rewardStatusCollection.create(currRsToCreate, function(errCreateNew, createdRs){
                    if (errCreateNew){
                        console.log('-- updateRewardStatusAllTime: mongodb error: ' + errCreateNew);
                        return callback(errCreateNew, null);
                    }
                    return updateRewardStatus(rsToUpdate, callback);
                });
            }
        }
    };
    if (!validator.validate.REWARDS_STATUS(listOfRewardStatus)) {
        console.log('-- updateRewardStatusAllTime: Validator Error - ', validator.validate.REWARDS_STATUS.errors);
        console.log('-- updateRewardStatusAllTime: Invalid Body - ', listOfRewardStatus);
        res.status(400).json({"error" : validator.validate.REWARDS_STATUS.errors});
        return;
    }
    var rsToUpdate = {
        "rsToRefresh" : [], // exists and will be updated
        "rsToCreate" : []   // new records
    };
    console.log("-- updateRewardStatusAllTime: num of received reward-status", listOfRewardStatus.length);
    findExistingAndNewRewards(listOfRewardStatus, rsToUpdate, function(errChecking, rsToUpdate){
        if (errChecking) {
            res.status(500).json(errChecking);
            return;
        }
        console.log("-- updateRewardStatusAllTime: num of reward-status to update", rsToUpdate["rsToRefresh"].length);
        console.log("-- updateRewardStatusAllTime: num of reward-status to create", rsToUpdate["rsToCreate"].length);
        updateRewardStatus(rsToUpdate, function(errUpdate, statusUpdate){
            if (errUpdate) {
                res.status(500).json(errUpdate);
                return;
            }
            console.log("-- updateRewardStatusAllTime: status after update - ", statusUpdate);
            var queryFindAll = {"userid": userid};
            rewardStatusCollection.find(queryFindAll, function(errFindAll, allRsOfUser){
                if (errFindAll){
                    console.log('-- updateRewardStatusAllTime: mongodb error: ' + errFindAll);
                    res.status(500).json(errFindAll);
                    return;
                }
                console.log("-- updateRewardStatus: total number of reward-status of user = ", allRsOfUser.length);
                //correct timestamp number of decimal places
                if(allRsOfUser!=undefined){
                    for(var h=0;h<allRsOfUser.length;h++){
                        if(allRsOfUser[h]["timestampsOfDaysWithTrips"]!=undefined){
                            for(var i=0;i<allRsOfUser[h]["timestampsOfDaysWithTrips"].length;i++){
                                if(allRsOfUser[h]["timestampsOfDaysWithTrips"][i].toString().length>15){
                                    allRsOfUser[h]["timestampsOfDaysWithTrips"][i]=Math.round(allRsOfUser[h]["timestampsOfDaysWithTrips"][i]*1000);
                                }
                            }
                        }
                    }
                }
                var response = {};
                response["rewards"]=allRsOfUser;
                userStatsDB.findOne({"userid" : req.tokenDecoded.uid}, function (err, userInDb){
                    if (err){
                        console.log('-- updateRewardStatusAllTime: invalid token - ' + err);
                        res.status(500).json(err);
                        return;
                    } else {                      
			if (userInDb === null || userInDb === undefined || userInDb === {} || userInDb["numberTotalDaysWithTrips"] === undefined || userInDb["numberTotalTrips"] === undefined) {
			    if (userInDb === null || userInDb === undefined || userInDb === {}) {
				console.log("-- updateRewardStatusAllTime: error empty rewards avoided numberTotalDaysWithTrips");
			    }                     
			    response["numberTotalDaysWithTrips"] = 0;
                            response["numberTotalTrips"] = 0;
                        } else {
                            response["numberTotalDaysWithTrips"] = userInDb["numberTotalDaysWithTrips"];
                            response["numberTotalTrips"] = userInDb["numberTotalTrips"];
                        }
                        console.log('-- updateRewardStatusAllTime: response - ' + JSON.stringify(response));
                        res.status(200).json(response);
                        return
                    }
                });
            });
        });
    });
};

/**
 * Returns all rewards of the system
 * 
 * @param req.tokenDecoded.uid contains an userid for role checking
 * @return list of rewards
 */
module.exports.getExistingRewards = function(req, res) {
    const userid = req.tokenDecoded.uid;
    // internal function:
    var getRewardsQueryBasedOnRoles = function (callback) {
        usersConstroller.getMyRoles(userid, function (errorCheck, roles) {
            if (errorCheck){
                console.log('-- getExistingRewards: mongodb error: ' + errorCheck);
                return callback(errCheck, null);
            }
            var queryForRewards;
            if (roles.includes("Admin") || roles.includes("Manager")) {
                queryForRewards = {}; // all rewards
                return callback(null, queryForRewards);
            } else if (roles.includes("CM")) {
                var queryMyCampaigns = { campaignManagers: userid };
                campaignCollection.find(queryMyCampaigns, function(errorCheck, campaigns) {
                    if (errorCheck){
                        callback(errorCheck, null);
                    }
                    var campaignIdsOfCM = [];
                    campaigns.forEach(campaign => {
                        campaignIdsOfCM.push(campaign._id);
                    });
                    queryForRewards = {"targetCampaignId": {$in: campaignIdsOfCM}};
                    return callback(null, queryForRewards);
                });
            } else {    // user is not Admin, Manager or CM:
                queryForRewards = {"targetCampaignId": {$in: []}};
                return callback(null, queryForRewards);
            }
        });
    };
    getRewardsQueryBasedOnRoles(function (errQuery, queryBasedOnRoles){
        if (errQuery) {
            console.log('-- getExistingRewards: mongodb error: ' + errQuery);
            res.status(500).json(errQuery);
            return;
        }
        console.log("Query based on roles: ", queryBasedOnRoles);
        rewardCollection.find(queryBasedOnRoles, function(errQueryRewards, rewards){
            if (errQueryRewards) {
                console.log('-- getExistingRewards: mongodb error: ' + errQueryRewards);
                res.status(500).json(errQueryRewards);
                return;
            }
            var rewardsToReturn = [];
            rewards.forEach( reward => {
                rewardsToReturn.push(responseFromReward(reward));
            });
            res.status(200).json(rewardsToReturn);
        });
    });
};

/**
 * Retrieves a reward based on a rewardId
 * 
 * @param req.params.rewardId
 */
module.exports.getRewardById = function(req, res) {
    var rewardId = req.params.rewardId;
    rewardCollection.findById(rewardId, function(errFind, reward){
        if (errFind) {
            console.log('-- getRewardById: mongodb error: ' + errFind);
            res.status(500).json(errFind);
            return;
        }
        res.status(200).json(responseFromReward(reward));
    });
};

/**
 * Edit reward
 * 
 * @param req.params.rewardId
 * @param req.body reward object
 */
module.exports.editReward = function(req, res) {
    var rewardId = req.params.rewardId;
    var updatedReward = req.body;
    var update = {
        $set: {
            "rewardName" : updatedReward.rewardName,
            "organizerName" : updatedReward.organizerName,
            "linkToContact" : updatedReward.linkToContact,
            "removed": updatedReward.removed,
            "descriptions": updatedReward.descriptions
        }
    };
    rewardCollection.findByIdAndUpdate(rewardId, update, function(errUpdate, oldReward){
        if (errUpdate) {
            console.log('-- editReward: mongodb error: ' + errUpdate);
            res.status(500).json(errUpdate);
            return;
        }
        res.status(200).json({"status": "ok"});
    });
};

/**
 * @ignore
 * 
 * Updates the status of the rewards of a certain user
 * 
 * @param req.tokenDecoded.uid 
 * @param req.body listOfRewardStatus
 */
module.exports.updateRewardStatus = function(req, res) {
    const userid = req.tokenDecoded.uid;
    var listOfRewardStatus = req.body;
    // recursive internal function:
    var findExistingAndNewRewards = function (rewardsStatusToCheck, rewardsStatusToReturn, callback) {
        if (rewardsStatusToCheck.length === 0){
            return callback(null, rewardsStatusToReturn);
        } else {
            var currRewardStatus = rewardsStatusToCheck.shift();                 // pop
            currRewardStatus["userid"] = userid;
            var queryFindIfExists = {"userid": userid, "rewardID": currRewardStatus.rewardID};
            rewardStatusCollection.findOne(queryFindIfExists, function(errFind, existentRewardStatus){
                if (errFind) {
                    console.log('-- updateRewardStatus: mongodb error: ' + errFind);
                    return callback(errFind, null);
                }
                if (existentRewardStatus){    // rewardStatus already exists
                    if (currRewardStatus.rewardVersion >= existentRewardStatus.rewardVersion){  // new version will be updated, older versions are ignored
                        rewardsStatusToReturn["rsToRefresh"].push(currRewardStatus);
                    }
                } else {                    // rewardStatus is new  
                    rewardsStatusToReturn["rsToCreate"].push(currRewardStatus);
                }

                return findExistingAndNewRewards(rewardsStatusToCheck, rewardsStatusToReturn, callback);
            });
        }
    };

    // recursive internal function:
    var updateRewardStatus = function(rsToUpdate, callback) {
        if (rsToUpdate["rsToRefresh"].length === 0 && rsToUpdate["rsToCreate"].length === 0){
            // after update all, query to get all rewardStatus
            return callback(null, {"status": "all rewards updated"});
        } else {
            if (rsToUpdate["rsToRefresh"].length > 0){
                var currRsToRefresh = rsToUpdate["rsToRefresh"].shift();                 // pop
                var queryUpdateExisting = {"userid": userid, "rewardID": currRsToRefresh.rewardID};
                rewardStatusCollection.findOneAndUpdate(queryUpdateExisting, currRsToRefresh, function(errUpdateExisting, oldRs){
                    if (errUpdateExisting){
                        console.log('-- updateRewardStatus: mongodb error: ' + errUpdateExisting);
                        return callback(errUpdateExisting, null);
                    }
                    return updateRewardStatus(rsToUpdate, callback);
                });
            }
            else {
                var currRsToCreate = rsToUpdate["rsToCreate"].shift();                 // pop
                rewardStatusCollection.create(currRsToCreate, function(errCreateNew, createdRs){
                    if (errCreateNew){
                        console.log('-- updateRewardStatus: mongodb error: ' + errCreateNew);
                        return callback(errCreateNew, null);
                    }
                    return updateRewardStatus(rsToUpdate, callback);
                });
            }
        }
    };
    // updateRewardStatus code:
    if (!validator.validate.REWARDS_STATUS(listOfRewardStatus)) {
        console.log('-- updateRewardStatus: Validator Error - ', validator.validate.REWARDS_STATUS.errors);
        console.log('-- updateRewardStatus: Invalid Body - ', listOfRewardStatus);
        res.status(400).json({"error" : validator.validate.REWARDS_STATUS.errors});
        return;
    }
    var rsToUpdate = {
        "rsToRefresh" : [], // exists and will be updated
        "rsToCreate" : []   // new records
    };
    console.log("-- updateRewardStatus: num of received reward-status", listOfRewardStatus.length);
    findExistingAndNewRewards(listOfRewardStatus, rsToUpdate, function(errChecking, rsToUpdate){
        if (errChecking) {
            res.status(500).json(errChecking);
            return;
        }
        console.log("-- updateRewardStatus: num of reward-status to update", rsToUpdate["rsToRefresh"].length);
        console.log("-- updateRewardStatus: num of reward-status to create", rsToUpdate["rsToCreate"].length);
        updateRewardStatus(rsToUpdate, function(errUpdate, statusUpdate){
            if (errUpdate) {
                res.status(500).json(errUpdate);
                return;
            }
            console.log("-- updateRewardStatus: status after update - ", statusUpdate);
            var queryFindAll = {"userid": userid};
            rewardStatusCollection.find(queryFindAll, function(errFindAll, allRsOfUser){
                if (errFindAll){
                    console.log('-- updateRewardStatus: mongodb error: ' + errFindAll);
                    res.status(500).json(errFindAll);
                    return;
                }
                console.log("-- updateRewardStatus: total number of reward-status of user = ", allRsOfUser.length);
                res.status(200).json(allRsOfUser);
            });
        });
    });
};

/**
 * Get reward status
 * 
 * @param req.params.rewardId rewardId
 */
module.exports.getRewardStatus = function(req, res) {
    var rewardId = req.params.rewardId;
    var queryRewardStatus = {"rewardID": rewardId};
    rewardStatusCollection.find(queryRewardStatus, function(errRewardStatus, rewardStatus){
        if (errRewardStatus){
            console.log('-- getRewardStatus: mongodb error: ' + errRewardStatus);
            res.status(500).json(errRewardStatus);
            return;
        }
        res.status(200).json(rewardStatus);
        return;
    });
};