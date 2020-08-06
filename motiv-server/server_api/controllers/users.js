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
 * User controller
 * 
 * This module is responsible for managing users
 */

var mongoose = require('mongoose');
var databases = require('../models/databases');
var usersDB = mongoose.model('User');
var usersSettingsDB = mongoose.model('UserSettings');
var validator = require('../validators/validator');
var campaignPage = require('./campaign');
var authentication = require("../authentication");
var campaignsCollection = databases.campaignDbConnection.model('campaign');
var countriesData = require("../countriesData");

/**
 * Add users to campaign
 * 
 * @param {*} uids 
 * @param {*} campaignId 
 * @param {*} callback 
 */
module.exports.addUsersCampaign = function(uids, campaignId, callback) {
    var query = {"userid" : { $in : uids } };
    var update = {$push: { onCampaigns : campaignId }};
    var options = {new : true};
    usersDB.updateMany(query, update, options, function (errorCheck, users){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null, users);
        }
    });
};

/**
 * Add users as campaign managers to campaign
 * 
 * @param {*} uids 
 * @param {*} campaignId 
 * @param {*} callback 
 */
module.exports.addCMsCampaign = function(uids, campaignId, callback) {
    var query = {"userid" : { $in : uids } };
    var update = {
        $push: { managesCampaigns : campaignId }, 
        $addToSet: { roles: "CM" } 
    };
    var options = {new : true};

    usersDB.updateMany(query, update, options, function (errorCheck, users){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null, users);
        }
    });
};

/**
 * Remove users from campaign
 * 
 * @param uids users ids
 * @param campaignId campaignid from which CMs will be removed
 */
module.exports.removeUsersCampaign = function(uids, campaignId, callback) {
    var query = {"userid" : { $in : uids } };
    var update = {$pull: { onCampaigns : campaignId }};
    var options = {new : true};

    usersDB.updateMany(query, update, options, function (errorCheck, users){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null, users);
        }
    });
};

/**
 * Remove campaign managers from campaign
 * 
 * @param uids CMs ids
 * @param campaignId campaignid from which CMs will be removed
 */
module.exports.removeCMsCampaign = function(uids, campaignId, callback) {
    var query = {"userid" : { $in : uids } };
    var update = {$pull: { managesCampaigns : campaignId }};
    var options = {new : true};
    usersDB.updateMany(query, update, options, function (errorCheck, users) {
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null, users);
        }
    });
};

/**
 * Get user for launched surveys
 * 
 * @returns a list of users 
 * @param launches.users
 */
module.exports.getUsersForLaunchedSurveys = function(launches, callback) {
    var query = {"userid" : { $in: launches.users}}
    usersDB.find(query, function (errorCheck, users){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            if (users.length !== 0){
                callback(null, users);
            }
            else {
                callback(null, []);
            }
        }
    });
};

/**
 * Get my roles
 * 
 * @returns roles
 * @param uid
 */
var getMyRoles = function(uid,callback){
    usersDB.find({"userid":uid}, function (error, userInDb){
        if (error){
            callback(error, null);
        }
        else {
            if (userInDb.length !== 0){
                callback(null, userInDb[0].roles);
            }
            else {
                callback(null, null);
            }
        }
    });
};

module.exports.getMyRoles = getMyRoles;

/**
 * Get user roles
 * 
 * @returns roles
 * @param req.params.userid
 */
module.exports.getUserRoles = function (req, res) {
    if (!req.params.userid){
        console.log('-- getUserRoles: userid is missing in request');
        res.status(400).json({"status" : "userid is missing in request"});
        return;
    }
    if (!(req.tokenDecoded.uid === req.params.userid)){
        console.log('-- getUserRoles: permission denied, user ' + req.tokenDecoded.uid 
                    + ' have no rights to get the roles of user ' + req.params.userid);
        res.status(403).json({"status" : "permission denied"});
        return;
    }
    usersDB.find({"userid":req.tokenDecoded.uid}, function (error, userInDb){
        if (error){
            console.log('-- getUserRoles: ' + error);
            res.status(500).json(error);
            return;
        }
        if(userInDb.length > 0) {
            res.status(200).json({"roles": userInDb[0].roles});
            console.log('-- getUserRoles: user roles sent = ' + userInDb[0].roles);
            return
        } else {
            res.status(500).json({"roles": []});
            console.log('-- getUserRoles: user not found ');
        }
    });
};

/**
 * Create new user
 * 
 * @param req.params.userid 
 * @param req.body.email email
 */
module.exports.createNewUser = function (req, res) {
    usersDB.find({"userid":req.tokenDecoded.uid}, function (error, userInDb){
        if (error){
            console.log('-- createNewUser: ' + error);
            res.status(500).json(error);
            return;
        } 
        if (userInDb.length !== 0){
            console.log('-- createNewUser: user with this id already exists - ', userInDb);
            res.status(403).json({"status" : "User with this id already exists"});
            return;
        }
        newUser = {
            userid : req.tokenDecoded.uid,
            email : req.body.email,
            roles : ["User"]
        };
        usersDB.create(newUser, function(error, user){  
            if (error){
                res.status(400).json(error);
            } else {
                res.status(200).json(user);
                //duplication verification
                usersDB.find({"userid":req.tokenDecoded.uid}, function (error, userInDb){
                    if(error){
                        console.log("--- verifying duplicated new user error")
                    }
                    else {
                        if(userInDb.length>1){
                            console.log("-- createNewUser: user:"+req.tokenDecoded.uid+" duplicated!");
                        }
                        if(userInDb.length==1){
                            console.log("-- createNewUser: user:"+req.tokenDecoded.uid+" created with success!");
                        }
                        if(userInDb.length==0){
                            console.log("-- createNewUser: user:"+req.tokenDecoded.uid+" not created!");
                        }
                    }
                });
            }
        });
        console.log('-- createNewUser: new user created');
    });
};


/**
 * @ignore
 * 
 * Get user info old
 */
module.exports.getUserInfoOld = function (req, res) {
    if (!req.params.userid){
        console.log('-- getUserInfoOld: userid is missing in request');
        res.status(400).json({"status" : "userid is missing in request"});
        return;
    }
    if (!(req.tokenDecoded.uid === req.params.userid)){
        console.log('-- getUserInfoOld: permission denied, user ' + req.tokenDecoded.uid 
                    + ' have no rights to get the data about user ' + req.params.userid);
        res.status(403).json({"status" : "permission denied"});
        return;
    }
    usersDB.findOne({"userid":req.tokenDecoded.uid}, function (error, userInDb){
        if (error){
            console.log('-- getUserInfoOld: ' + error);
            res.status(500).json(error);
            return;
        }
        var result = {
            "userid": userInDb.userid,
            "email": userInDb.email,
            "roles": userInDb.roles,
            "age": 16,
            "pushNotificationToken": userInDb.pushNotificationToken,
            "onCampaigns": userInDb.onCampaigns,
            "managesCampaigns": userInDb.managesCampaigns
        }
        res.status(200).json(result);
        console.log('-- getUserInfoOld: userInfo sent');
    });
};

/**
 * Get user info
 * 
 * @param req.tokenDecoded.uid
 */
module.exports.getUserInfo = function (req, res) {
    usersDB.findOne({"userid":req.tokenDecoded.uid}, function (error, userInDb){
        if (error){
            console.log('-- getUserInfo: ' + error);
            res.status(500).json(error);
            return;
        }
        var userToSend = {};    // send only relevant to smartphone properties
        userToSend.userid = userInDb.userid;
        userToSend.email = userInDb.email;
        userToSend.pushNotificationToken = userInDb.pushNotificationToken;
        userToSend.onCampaigns = userInDb.onCampaigns;
        userToSend.userSettings = userInDb.userSettings;
        if (userToSend.userSettings) {
            userToSend.userSettings.stories.forEach( story => {
                story.availableTimestamp = Math.trunc(story.availableTimestamp);
                story.readTimestamp = Math.trunc(story.readTimestamp);
            });
        }
        res.status(200).json(userToSend);
        console.log('-- getUserInfo: userInfo sent');
    });
};

/**
 * Get user data
 * 
 * @param req.query.campaignid
 * @returns users info for a certain campaign
 */
module.exports.getUserData = function (req, res) {
    var campaignid = JSON.parse(req.query.campaignid);
    var executeQuery = function (queryToPerform){
        var projection = { "_id": 0, "userid": 1, "onCampaigns": 1, "registerTimestamp": 1,
        "userSettings.prodValue": 1, "userSettings.relValue": 1, "userSettings.actValue": 1, "userSettings.country":1,
        "userSettings.city": 1, "userSettings.minAge": 1, "userSettings.maxAge": 1, "userSettings.gender": 1, "userSettings.degree": 1,
        "userSettings.preferedMots": 1, "userSettings.hasSetMobilityGoal": 1, "userSettings.mobilityGoalChosen": 1, "userSettings.mobilityGoalPoints": 1,
        "userSettings.lang": 1, "userSettings.maritalStatusHousehold": 1, "userSettings.numberPeopleHousehold": 1, "userSettings.yearsOfResidenceHousehold": 1,
        "userSettings.labourStatusHousehold": 1, "userSettings.pointsPerCampaign": 1, "userSettings.workAddress": 1,"userSettings.homeAddress": 1};
        usersDB.find(queryToPerform, projection, function(errorUsers, usersList){
            if (errorUsers){
                console.log('-- getUserData: ' + errorUsers);
                res.status(500).json({"error" : errorUsers});
                return;
            } else {
                res.status(200).json(usersList);
            }
        });
    };
    var queryToPerform;
    if (campaignid !== ""){                             // users of specific campaign 
        campaignsCollection.findById(campaignid, function(errCampaigns, campaignObj){
            if (errCampaigns){
                console.log('-- getUserData: ' + errCampaigns);
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
                console.log("-- getUserData: Users in black list: ", usersBlackList);
                queryToPerform = {"userid": {"$in": usersInCurrentCampaign, "$nin": usersBlackList } };
                executeQuery(queryToPerform);
            }
        });
    } else {                                            // all users
        queryToPerform = {};
        executeQuery(queryToPerform);
    }
};


/**
 * @ignore
 * 
 * Updates user info
 */
module.exports.updateUserInfoOld = function (req, res) {
    var returnOnboarding = function (req, res) {
        usersSettingsDB.find({"userid": req.tokenDecoded.uid }, function(error, userSettings) {
            if (error){
                console.log('-- updateUserInfoOld: ' + error);
                res.status(500).json(error);
                return;
            }
            var uu = {}
            if (userSettings.length == 0){
                uu.NeedsOnboarding = true;
            } else {
                uu.NeedsOnboarding = false;
            }
            res.status(200).json(uu);
            console.log('-- updateUserInfoOld: userInfo updated - ', uu);
        });
    }
    if (!req.params.userid){
        console.log('-- updateUserInfoOld: userid is missing in request');
        res.status(400).json({"status" : "userid is missing in request"});
        return;
    }
    if (!(req.tokenDecoded.uid === req.params.userid)){
        console.log('-- updateUserInfoOld: permission denied, user ' + req.tokenDecoded.uid 
                    + ' have no rights to update the data about user ' + req.params.userid);
        res.status(403).json({"status" : "permission denied"});
        return;
    }
    usersDB.find({"userid":req.tokenDecoded.uid}, function (error, userInDb){
        if (error){
            console.log('-- updateUserInfoOld: ' + error);
            res.status(500).json(error);
            return;
        }
        if (userInDb.length !== 0){
            var query = {"userid" : req.tokenDecoded.uid};
            var update = {$set:{"email" : req.body.email, "pushNotificationToken" : req.body.pnToken}};
            var options = {new : true};
            usersDB.findOneAndUpdate(query, update, options, function (error, updatedUser){
                if (error){
                    console.log('-- updateUserInfoOld: ' + error);
                    res.status(500).json(error);
                    return;
                } else {
                    returnOnboarding(req, res);
                }
            });
        } else {
            newUser = {
                userid : req.tokenDecoded.uid,
                email : req.body.email,
                roles : ["User"],
                pushNotificationToken: req.body.pnToken,
                onCampaigns : [],
                managesCampaigns: []
            };
            usersDB.create(newUser, function(error, user){
                if (error){
                    res.status(400).json(error);
                } else {
                    returnOnboarding(req, res);
                }
            });
        }
    });
};

/**
 * Updates user profile
 * 
 * @param req.body user object 
 * @param req.tokenDecoded.uid
 */
module.exports.updateUserInfo = function (req, res) {
    var getCampaignNameByCountryIso = function(countryIso){
        var globalCampaignName;
        if (countryIso === "BEL"){
            globalCampaignName = "Belgium_Global";
        } else if (countryIso === "HRV"){
            globalCampaignName = "Croatia_Global";
        } else if (countryIso === "FIN"){
            globalCampaignName = "Finland_Global";
        } else if (countryIso === "FRA"){
            globalCampaignName = "France_Global";
        } else if (countryIso === "ITA"){
            globalCampaignName = "Italy_Global";
        } else if (countryIso === "NOR"){
            globalCampaignName = "Norway_Global";
        } else if (countryIso === "PRT"){
            globalCampaignName = "Portugal_Global";
        } else if (countryIso === "SVK"){
            globalCampaignName = "Slovakia_Global";
        } else if (countryIso === "ESP"){
            globalCampaignName = "Spain_Global";
        } else if (countryIso === "CHE"){
            globalCampaignName = "Switzerland_Global";
        } else {
            globalCampaignName = "Other_Global";
        }
        return globalCampaignName;
    }
    var getGlobalCampaignIdByCountryIso = function(countryIso, callback){
        console.log('-- updateUserInfo: country iso:' + countryIso);
        var globalCampaignName = getCampaignNameByCountryIso(countryIso);
        campaignsCollection.findOne({"name": globalCampaignName}, function(campErr, campaignObj){
            if (campErr){
                return callback(campErr, null);
            } else {
                console.log('-- updateUserInfo: get global campaign id: ', campaignObj._id, "; CountryIso: ", countryIso);
                return callback(null, campaignObj._id);
            }
        })
    };
    var updateCampaigns = function (campaignsToAdd, campaignsToRemove, userid, res){            // recursive function!
        if (campaignsToAdd.length === 0 && campaignsToRemove.length === 0){
            res.status(200).json({success: true});
            return;
        }
        else if (campaignsToAdd.length > 0) {
            var currCampaignToAdd = campaignsToAdd.shift();                 // pop
            campaignsCollection.findByIdAndUpdate(currCampaignToAdd, {"$addToSet": {"usersOnCampaign": userid}}, function (errAdd, oldCampaign){
                if (errAdd){
                    console.log('-- updateUserInfo: ' + errAdd);
                    res.status(500).json(errAdd);
                    return;
                } else {
                    return updateCampaigns(campaignsToAdd, campaignsToRemove, userid, res);
                }
            });
        }
        else if (campaignsToRemove.length > 0){
            var currCampaignToRemove = campaignsToRemove.shift();            // pop
            campaignsCollection.findByIdAndUpdate(currCampaignToRemove, {"$pull": {"usersOnCampaign": userid}}, function(errRem, oldCamp){
                if (errRem){
                    console.log('-- updateUserInfo: ' + errRem);
                    res.status(500).json(errRem);
                    return;
                } else {
                    return updateCampaigns(campaignsToAdd, campaignsToRemove, userid, res);
                }
            });
        }
        
    };
    var updateExistingUserAndCampaigns = function (userToUpdate, campaignsToAdd, campaignsToRemove, res) {
        usersDB.findOneAndUpdate({"userid": userToUpdate.userid}, userToUpdate, function(errorUpdate, prevUser){
            if (errorUpdate){
                console.log('-- updateUserInfo: ' + errorUpdate);
                res.status(500).json(errorUpdate);
                return;
            } else {
                console.log('-- updateUserInfo: existing user updated! Now updating campaigns...');
                updateCampaigns(campaignsToAdd, campaignsToRemove, userToUpdate.userid, res);
            }
        });
    };
    var updateUser = function (userToUpdate, res){
        usersDB.findOne({"userid": userToUpdate.userid}, function(errorFind, userFound){
            if (errorFind) {
                console.log('-- updateUserInfo: ' + errorFind);
                res.status(500).json(errorFind);
                return;
            } else {
                userToUpdate.onCampaigns = [...new Set(userToUpdate.onCampaigns)];          // removes duplicates
                var countryIso;
                if (userToUpdate.userSettings !== null){
                    // transform if necessary country name in country iso:
                    countryIso = countriesData.getCountryIsoByCountryName(userToUpdate.userSettings.country);
                    if (countryIso === undefined){
                        countryIso = "SVK";           // default country iso
                    }
                    userToUpdate.userSettings.country = countryIso;
                }
                if (userFound === null){ // create new user
                    console.log("####NEW STOP 26-SEPT - creating new user:"+userToUpdate.userid+" -- BEGIN --####");
                    userToUpdate["roles"] = ["User"];      // default values
                    userToUpdate["managesCampaigns"] = [];
                    userToUpdate["registerTimestamp"] = new Date().getTime();
                    // subscribe user to Global campaigns:
                    getGlobalCampaignIdByCountryIso(countryIso, function(errGlobalCampaigns, globalCampaignId){
                        if (errGlobalCampaigns) {
                            console.log('-- updateUserInfo: ' + errGlobalCampaigns);
                            res.status(500).json(errGlobalCampaigns);
                            return;
                        } else {
                            if (globalCampaignId !== undefined && globalCampaignId !== null){
                                userToUpdate.onCampaigns.push(globalCampaignId);
                            }
                            usersDB.create(userToUpdate, function(errorCreation, user){
                                if (errorCreation){
                                    console.log('-- updateUserInfo: ' + errorCreation);
                                    res.status(500).json(errorCreation);
                                    return;
                                } else {
                                    console.log('-- updateUserInfo: new user created!');
                                    usersDB.find({"userid":req.tokenDecoded.uid}, function (error, userInDb){
                                        if(error){
                                            console.log("--- verifying duplicated new user error")
                                        }
                                        else {
                                            if(userInDb.length>1){
                                                console.log("-- updateUserInfo: user:"+req.tokenDecoded.uid+" duplicated!");
                                            }
                                            if(userInDb.length==1){
                                                console.log("-- updateUserInfo: user:"+req.tokenDecoded.uid+" created with success!");
                                            }
                                            if(userInDb.length==0){
                                                console.log("-- updateUserInfo: user:"+req.tokenDecoded.uid+" not created!");
                                            }
                                            var campaignsOfUser = userToUpdate.onCampaigns.slice(); // slice -> copy array by value
                                            updateCampaigns(campaignsOfUser, [], userToUpdate.userid, res);
                                            return;
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {      // update existing user
                    // update if new version >= existing version of settings (is pushNotificationToken updated with regularity?)
                    if (userFound["userSettings"] === undefined || userFound["userSettings"].version <= userToUpdate["userSettings"].version){
                        var campaignsToAdd = [];
                        var campaignsToRemove = [];
                        userToUpdate.onCampaigns.forEach(camp => {
                            if (! userFound.onCampaigns.includes(camp)){
                                campaignsToAdd.push(camp);
                            }
                        });
                        var campaignsToKeep = [];
                        userFound.onCampaigns.forEach(camp => {
                            if (! userToUpdate.onCampaigns.includes(camp)){
                                campaignsToKeep.push(camp);
                            }
                        });
                        userToUpdate.onCampaigns.push(...campaignsToKeep);
                        console.log("-- updateUserInfo: add user to : ", campaignsToAdd);
                        console.log("-- updateUserInfo: remove user from : ", campaignsToRemove);
                        // always subscribe user in global campaign:
                        getGlobalCampaignIdByCountryIso(countryIso, function(errGlobalCampaigns, globalCampaignId){
                            if (errGlobalCampaigns) {
                                console.log('-- updateUserInfo: ' + errGlobalCampaigns);
                                res.status(500).json(errGlobalCampaigns);
                                return;
                            } else {
                                globalCampaignId = globalCampaignId.toString();     // globalCampaignId was of type object!
                                if (globalCampaignId !== undefined && globalCampaignId !== null){
                                    if (!userToUpdate.onCampaigns.includes(globalCampaignId)){
                                        userToUpdate.onCampaigns.push(globalCampaignId);
                                    }
                                    campaignsToAdd.push(globalCampaignId);  // update the global campaign always!
                                }
                                updateExistingUserAndCampaigns(userToUpdate, campaignsToAdd, campaignsToRemove, res);
                            }
                        });
                    } else {
                        res.status(304).json({success: true});
                    }
                }
            }
        });
    };
    if (! validator.validate.UPDATE_USER_INFO(req.body) ){
        console.log('-- updateUserInfo: Validator Error - ', validator.validate.UPDATE_USER_INFO.errors);
        console.log('-- updateUserInfo: Invalid Body - ', req.body);
        res.status(400).json({"status" : validator.validate.UPDATE_USER_INFO.errors});
        return;
    }
    if (req.body["userid"] === undefined || req.body["email"] === undefined){
        authentication.getUserById(req.tokenDecoded.uid, function(errorUser, userEmail){
            if (errorUser) {
                console.log('-- updateUserInfo: ' + errorUser);
                res.status(500).json(errorUser);
                return;
            } else {
                req.body["userid"] = req.tokenDecoded.uid;
                req.body["email"] = userEmail;
                updateUser(req.body, res);
            }
        });
    } else {
        updateUser(req.body, res);
    }
};

/**
 * Checks if user needs onboarding
 * 
 * @param req.tokenDecoded.uid
 * @returns {boolean} needsOnboarding
 * @returns {number} currentVersion
 */
module.exports.needsOnboarding = function (req, res) {
    usersDB.findOne({"userid" : req.tokenDecoded.uid}, function (err, userInDb){
        if (err){
            console.log('-- needsOnboarding: ' + err);
            res.status(500).json(err);
            return;
        } else {
            var response = {};
            if (userInDb === null || userInDb["userSettings"] === undefined) {
                response["needsOnboarding"] = true;
                response["currentVersion"] = -1;
            } else {
                response["needsOnboarding"] = false;
                response["currentVersion"] = userInDb.userSettings.version;
            }
            console.log('-- needsOnboarding: response - ' + JSON.stringify(response));
            res.status(200).json(response);
            return
        }
    });
};

/**
 * Removes user profile
 * 
 * @param req.tokenDecoded.uid
 */
module.exports.removeUser = function (req, res) {
    if (!req.params.userid){
        console.log('-- removeUser: userid is missing in request');
        res.status(400).json({"status" : "userid is missing in request"});
        return;
    }
    if (!(req.tokenDecoded.uid === req.params.userid)){
        console.log('-- removeUser: permission denied, user ' + req.tokenDecoded.uid 
                    + ' have no rights to remove the data about user ' + req.params.userid);
        res.status(403).json({"status" : "permission denied"});
        return;
    }
    usersDB.findOneAndRemove({"userid" : req.tokenDecoded.uid}, function (error, removedUser){
        if (error){
            console.log('-- removeUser: ' + error);
            res.status(500).json(error);
            return;
        }
        res.status(204).json({});
        console.log('-- removeUser: userInfo removed - ', removedUser);
    });
};

/**
 * Get all users
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getAllUsers = function (req, res) {
    usersDB.find({}, function (error, user){
        if (error){
            console.log('-- getAllUsers: ' + error);
            res.status(500).json(error);
            return;
        }
        res.status(200).json(user);
    });

};

/**
 * Get users by list of ids
 * 
 * @param req.query.usersIds list of ids
 */
module.exports.getUsersByListOfIds = function(req, res) {
    var usersIds = JSON.parse(req.query.usersIds);      // parameter is array of IDs
    var query = { userid: { $in : usersIds } };
    usersDB.find(query, function(errUsers, users){
        if (errUsers){
            console.log('-- getUsersByListOfIds: ' + errUsers);
            res.status(500).json(errUsers);
            return;
        } else {
            res.status(200).json(users);
            return;
        }
    });
};

/**
 * Update roles
 * 
 * @param req.params.userid
 * @param req.body roles
 */
module.exports.updateRoles = function (req, res) {
    var query = {"userid" : req.params.userid};
    var update = {$set:{"roles" : req.body}};
    var options = {new : true};
    usersDB.findOneAndUpdate(query, update, options, function (error, updatedUser){
        if (error){
            console.log('-- updateRoles: ' + error);
            res.status(500).json(error);
            return;
        }
        res.status(200).json(updatedUser);
        console.log('-- updateRoles: roles updated - ', updatedUser);
    });
}

/**
 * Update user settings
 * 
 * @ignore
 * @param req.tokenDecoded.uid
 * @param req.body user settings
 */
module.exports.UpdateSettings = function (req, res) {
    usersDB.find({"userid":req.tokenDecoded.uid}, function (error, userInDb){
        if (error){
            console.log('-- UpdateSettings: ' + error);
            res.status(500).json(error);
            return;
        } 
        if (userInDb.length == 0){
            console.log('-- UpdateSettings: user with this id doesn\'t exist - ', req.tokenDecoded.uid);
            res.status(403).json({"status" : "User with this id doesn\'t exist"});
            return;
        }
        //insert/update 
        usersSettingsDB.find({"userid":req.tokenDecoded.uid}, function(error, settingsInDb) {
            if (error){
                console.log('-- UpdateSettings: ' + error);
                res.status(500).json(error);
                return;
            }
            var settings = {}
            settings.userid = req.tokenDecoded.uid 
            settings.prodValue = req.body.prodValue 
            settings.relValue = req.body.relValue 
            settings.actValue = req.body.actValue 
            settings.preferedMots = req.body.preferedMots 
            settings.name = req.body.name 
            settings.country = req.body.country 
            settings.city = req.body.city 
            settings.minAge = req.body.minAge 
            settings.maxAge = req.body.maxAge 
            settings.gender = req.body.gender 
            settings.degree = req.body.degree 
            if (settingsInDb.length == 0) {
                //create
                usersSettingsDB.create(settings, function(error, settings){
                    if (error){
                        res.status(400).json(error);
                    } else {
                        //update user for selected campaigns
                        for (campaign in req.body.campaigns){
                            campaignPage.addUserCampaignByUserRequest(req.body.campaigns[campaign], req.tokenDecoded.uid)
                        }                
                        res.status(200).json(settings);
                    }
                });
            } else {
                //update
                var query = {"userid" : req.tokenDecoded.uid};
                var update = {$set:
                    {"userid" : req.tokenDecoded.uid
                    , "prodValue" : req.body.prodValue
                    , "relValue" : req.body.relValue
                    , "actValue" : req.body.actValue
                    , "preferedMots" : req.body.preferedMots
                    , "name" : req.body.name
                    , "country" : req.body.country
                    , "city" : req.body.city
                    , "minAge" : req.body.minAge
                    , "maxAge" : req.body.maxAge
                    , "gender" : req.body.gender
                    , "degree" : req.body.degree}
                };
                var options = {new : true};
                usersSettingsDB.findOneAndUpdate(query, update, options, function (error, updatedUser){
                    if (error){
                        console.log('-- UpdateSettings: ' + error);
                        res.status(500).json(error);
                        return;
                    }
                    for (campaign in req.body.campaigns){
                        campaignPage.addUserCampaignByUserRequest(req.body.campaigns[campaign], req.tokenDecoded.uid)
                    }
                    res.status(200).json(updatedUser);
                    console.log('-- UpdateSettings: userInfo updated - ', updatedUser);
                });
            }
        })
        console.log('-- UpdateSettings: new user created');
    });
};