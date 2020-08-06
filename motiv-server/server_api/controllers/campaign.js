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
 * Campaign Controller
 * 
 * Woorti Motiv App contains a campaign system where users can be included in campaigns.
 * These campaigns collect data from their users and can deliver rewards (rewards.js)
 * Campaigns can include users belonging to:
 * - one country (Any city)
 * - one city
 * - a certain area (Any by radius)
 */

var mongoose = require('mongoose');
var databases = require('../models/databases');

var campaignDb = databases.campaignDbConnection.model('campaign');

var usersConstroller = require('./users');
var usersDB = mongoose.model('User');
var countriesData = require("../countriesData");

/**
 * Composes the campaign/campaigns into a different form to send
 *
 * @param campaign campaign with a different format
 * @returns sendable object
 */
var responseFromCampaign = function(campaign) {
    respCampaign = {};
    respCampaign.name = campaign.name;
    respCampaign.campaignDescription = campaign.campaignDescription;
    respCampaign.pointsTripPurpose = campaign.pointsTripPurpose;
    respCampaign.pointsTransportMode = campaign.pointsTransportMode;
    respCampaign.pointsWorth = campaign.pointsWorth;
    respCampaign.pointsActivities = campaign.pointsActivities;
    respCampaign.pointsAllInfo = campaign.pointsAllInfo;
    respCampaign.country = campaign.country;
    respCampaign.city = campaign.city;
    respCampaign.radius = campaign.radius;
    respCampaign.location = {lon: campaign.location.lon, lat: campaign.location.lat},
    respCampaign.active = campaign.active;
    respCampaign.usersOnCampaign = campaign.usersOnCampaign;
    respCampaign.campaignManagers = campaign.campaignManagers;
    respCampaign.campaignId = campaign._id;
    respCampaign.isPrivate = campaign.isPrivate;
    respCampaign.privateCode = campaign.privateCode;
    return respCampaign;
};

/**
 * Receives a list of campaigns and build a proper response
 *
 * @param campaigns campaigns with a different format
 * @returns list of campaigns
 */
var responseFromCampaigns = function(campaigns) {
    return campaigns.map( campaign => responseFromCampaign(campaign));
};

/**
 * Gets all the campaigns
 *
 * @param callback return function to be called
 * @returns function call
 */
var getAllCampaigns = function(callback) {
    var query = {active: true};
    campaignDb.find(query, function(errorCheck,campaigns){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null,responseFromCampaigns(campaigns));
        }
    });
};

/**
 * Gets all campaigns by country/city
 * 
 * @param ccity
 * @param ccountry
 * @param callback
 * @returns callback call
 */
var getCampaignsbyCityCountry = function(ccountry, ccity, callback) {
    var query = {country: ccountry, city: {$in : [ccity, "Any city", "Any by radius"]}, active: true, isPrivate: false};
    campaignDb.find(query, function(errorCheck,campaigns){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null,responseFromCampaigns(campaigns));
        }
    });
};

/**
 * Gets all the accessible campaigns for a certain user
 * 
 * @param uid user id
 * @param {boolean} managed true if the user is admin, manager or Campaign Manager; otherwise false
 * @param callback
 * @returns callback call
 */
var getCampaigns = function (uid, managed, callback) {
    if (managed) {
        usersConstroller.getMyRoles(uid, function (errorCheck, roles){
            if (errorCheck){
                callback(errorCheck, null);
            }
            else {
                if (roles.indexOf("Admin") > -1 || roles.indexOf("Manager") > -1){
                    campaignDb.find(function(errorCheck, campaigns) {
                        if (errorCheck){
                            callback(errorCheck, null);
                        }
                        else {
                            callback(null, responseFromCampaigns(campaigns));
                        }
                    });
                } else if (roles.indexOf("CM") > -1 ){
                    var query = { campaignManagers: uid }
                    campaignDb.find(query, function(errorCheck, campaigns) {
                        if (errorCheck){
                            callback(errorCheck, null);
                        }
                        else {
                            callback(null, responseFromCampaigns(campaigns));
                        }
                    });
                } else {
                    callback(null, []);
                }
            }
        });
    } else {
        var query = { usersOnCampaign : uid }
        campaignDb.find(query, function(errorCheck, campaigns) {
            if (errorCheck){
                callback(errorCheck, null);
            }
            else {
                callback(null, responseFromCampaigns(campaigns));
            }
        });
    }
};

/**
 * Verifies if privateCodeToCheck is available to use as a campaign private code
 * 
 * @param privateCodeToCheck
 * @param callback
 * @returns callback call
 */
var validatePrivateCode = function(privateCodeToCheck, callback) {
    var query = {isPrivate: true, privateCode: privateCodeToCheck};
    campaignDb.find(query, function(errorCheck, results) {
        if (errorCheck){
            callback(errorCheck, null);
        } else {
            if (results.length != 0){
                callback(null, {"isValidCode": false});
            } else {
                callback(null, {"isValidCode": true});
            }
        }
    });
};

/**
 * Creates a new campaign
 * 
 * @param newCampaign campaign object
 * @param callback
 * @returns callback call
 */
var newCampaign = function (newCampaign, callback) {
    var query = {isPrivate: true, privateCode: newCampaign.privateCode};
    campaignDb.find(query, function(errorCheck, results) {
        if (errorCheck){
            callback(errorCheck, null);
            return;
        } else {
            if (results.length != 0){
                console.log("-- newCampaign: Code already exists");
                callback("PrivateCodeAlreadyInUse", null);
                return;
            } else {
                console.log("-- newCampaign: Code is valid");
                campaignDb.create(newCampaign, function (errorCheck, newCampaign){
                    if (errorCheck){
                        callback(errorCheck, null);
                    } 
                    else {
                        if (newCampaign.campaignManagers.length > 0) {
                            usersConstroller.addCMsCampaign(newCampaign.campaignManagers, newCampaign._id, function(error, result) {
                                if (error) {
                                    console.log("addCMsCampaign: error - " + error)
                                }
                            });
                        }
                        callback(null, responseFromCampaign(newCampaign))
                    }
                });
            }
        }
    });
};

/**
 * 
 * Edits Campaign
 * Checks user permissions. If he has permission to edit campaign it will call updateCampaign
 * 
 * @param newCampaign campaign object to replace the old one
 * @param uid user id for role checking
 * @param callback
 * @return callback call
 */
var editCampaign = function (newCampaign, uid, callback) {
    usersConstroller.getMyRoles(uid, function (errorCheck, roles){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            if (roles.indexOf("Admin") > -1 ){
                updateCampaign(newCampaign, uid, true, callback);
            } else if (roles.indexOf("CM") > -1 ){
                updateCampaign(newCampaign, uid, false, callback);
            } else {
                callback(null, null);
            }
        }
    });
};

/**
 * Updates campaign on the db
 * 
 * @param newCampaign campaign object
 * @param uid to check if user has permission
 * @param {boolean} admin
 * @param callback
 * @returns callback call
 */
var updateCampaign = function(newCampaign, uid, admin, callback) {

    campaignDb.findById(newCampaign.campaignId, function(errorCheck, oldCampaign){
        if (errorCheck){
            callback(errorCheck, null);
        } else if(oldCampaign === null){
            callback(null, null);
        }
        else {
            var query = {};
            if (admin) {
                query = {"_id" : newCampaign.campaignId};
            } else {
                query = {"_id" : newCampaign.campaignId, campaignManagers: uid};
            }
            var update = {$set:
                {
                    name: newCampaign.name,
                    campaignDescription : newCampaign.campaignDescription,
                    isPrivate: newCampaign.isPrivate,
                    privateCode: newCampaign.privateCode,
                    pointsTripPurpose: newCampaign.pointsTripPurpose,
                    pointsTransportMode: newCampaign.pointsTransportMode,
                    pointsWorth: newCampaign.pointsWorth,
                    pointsActivities: newCampaign.pointsActivities,
                    pointsAllInfo: newCampaign.pointsAllInfo,
                    country: newCampaign.country,
                    city: newCampaign.city,
                    active: newCampaign.active,
                    usersOnCampaign: newCampaign.usersOnCampaign,
                    campaignManagers: newCampaign.campaignManagers,
                }
            };
            var options = {new : true};
            campaignDb.findOneAndUpdate(query, update, options, function (errorCheck, newCampaign){
                if (errorCheck){
                    callback(errorCheck, null);
                }
                else {
                    var usersToRemove = [];
                    var managersToRemove = [];
                    var managersToAdd = [];
                    if (oldCampaign !== null && newCampaign !== null){
                        usersToRemove = oldCampaign.usersOnCampaign.filter(uid => newCampaign.usersOnCampaign.indexOf(uid) === -1 );
                        managersToRemove = oldCampaign.campaignManagers.filter(uid => newCampaign.campaignManagers.indexOf(uid) === -1 );
                        managersToAdd = newCampaign.campaignManagers.filter(uid => oldCampaign.campaignManagers.indexOf(uid) === -1 );
                    }
                    if (newCampaign === null || newCampaign === undefined || newCampaign === {} || newCampaign === []) {
                        console.log("removeUsersCampaign: possible error with empty newCampaign when invoking ResponseFromCampaigns");
                    }
                    usersToRemove = [];
                    if (usersToRemove.length > 0) {
                        usersConstroller.removeUsersCampaign(usersToRemove, newCampaign._id, function(error, result) {
                            if (error) {
                                console.log("removeUsersCampaign: error - " + error)
                            }
                        });
                    }

                    if (managersToAdd.length > 0) {
                        usersConstroller.addCMsCampaign(managersToAdd, newCampaign._id, function(error, result) {
                            if (error) {
                                console.log("addCMsCampaign: error - " + error)
                            }
                        });
                    }
                    if (managersToRemove.length > 0) {   
                        usersConstroller.removeCMsCampaign(managersToRemove, newCampaign._id, function(error, result) {
                            if (error) {
                                console.log("removeCMsCampaign: error - " + error)
                            }
                        });
                    }
                    if(newCampaign===null || newCampaign.name ===null){
                        callback(null,null);
                        return;
                    }
                    callback(null, responseFromCampaign(newCampaign));
                }
            });
        }
    });
};

/**
 * Adds user to campaign 
 * 
 * @param {*} campaignId 
 * @param {*} uid 
 * @param {*} callback 
 * @returns callback call
 */
var addUserCampaign = function (campaignId, uid, callback) {
    var query = {"_id" : campaignId};
    var update = {$push: {usersOnCampaign: uid}};
    var options = {new : true};
    campaignDb.findOneAndUpdate(query, update, options, function (errorCheck, newCampaign){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            usersConstroller.addUsersCampaign([uid], campaignId, function(errorCheck, updatedUser){
                if (errorCheck){
                    callback(errorCheck, null);
                } else {
                    callback(null, updatedUser)
                }
            });
        }
    });
};

/**
 * Set user campaigns
 * 
 * @param {boolean} add sets if we are adding or removing the user from campaign
 * @param {boolean} manager sets if we are adding or removing the user from campaign manager
 * @returns callback call
 */
var setUserCampaign = function (Campaign, uid, add, manager, callback) {
    var update;
    var where;
    if(manager){
        where = {campaignManagers: uid};
    } else {
        where = {usersOnCampaign: uid};
    }
    if(add){
        update = {$push: where};
    } else {
        update = {$pull: where};
    }
    var query = {"uid" : uid};
    var options = {new : true};
    usersConstroller.findOneAndUpdate(query, update, options, function (errorCheck, newUser){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null, newUser)
        }
    });
};

/**
 * Deactivates campaign
 * 
 * @param campaign campaign obj
 * @param uid required to check role
 * @param callback
 * @returns callback call
 * 
 */
var deactivateCampaign = function (campaign,uid, callback) {
    campaign.active = false;
    editCampaign(campaign, uid, function (errorCheck, campaign){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null,campaign)
        }
    });
};

/**
 * Reactivates campaign
 * 
 * @param campaign campgain object
 * @param uid required to check role
 * @param callback
 * @returns callback call
 */
var reactivateCampaign = function (campaign, uid, callback) {
    campaign.active = true;
    editCampaign(campaign, uid, function (errorCheck, campaign){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null,campaign)
        }
    });
};


/**
 * Gets all campaigns
 * 
 * @param {*} req request
 * @param {*} res response
 * @return list of campaigns
 */
module.exports.getAllCampaigns = function (req, res) {
    getAllCampaigns(function (error, campaigns){
        if (error){
            console.log('-- getAllCampaigns: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- getAllCampaigns: end');
    });
};

/**
 * Gets campaings by city
 * 
 * @param req.params.city city
 * @param req.params.country country
 * @returns list of campaigns
 */
module.exports.getCampaignsByCity = function (req, res) {
    console.log("-- getCampaignsByCity: country in request: ", req.params.country);
    var countryIso = countriesData.getCountryIsoByCountryName(req.params.country);
    console.log("-- getCampaignsByCity: country to search: ", countryIso);
    if (countryIso === undefined){
        countryIso = req.params.country;
    }
    getCampaignsbyCityCountry(countryIso, req.params.city, function (error, campaigns){
        if (error){
            console.log('-- getCampaignsByCity: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- getCampaignsByCity: end');
    });
};

/**
 * Get campaigns of user
 * 
 * @param req.tokenDecoded.uid userid
 * @returns list of campaigns 
 */
module.exports.getCampaignsObjectsOfUser = function (req, res) {
    var userid = req.tokenDecoded.uid;
    var queryUser = {"userid": userid};
    usersDB.findOne(queryUser, function(errFindUser, foundUser){
        if (errFindUser){
            console.log('-- getCampaignsObjectsOfUser: ' + errFindUser);
            res.status(500).json(errFindUser);
            return;
        } else {
            if (foundUser !== undefined && foundUser !== null) {
                var campaignsOfUser = foundUser.onCampaigns;
                var campaignsToQuery = [];
                campaignsOfUser.forEach(cmp => {
                    if (cmp !== "dummyCampaignID") {
                        campaignsToQuery.push(cmp);
                    }
                });
                console.log('-- getCampaignsObjectsOfUser: found', campaignsToQuery.length, " campaigns for user ", userid);
                var queryCampaign = { _id : { $in : campaignsToQuery } };
                campaignDb.find(queryCampaign, function(errCmp, campaignsOfUser){
                    if (errCmp){
                        console.log('-- getCampaignsObjectsOfUser: ' + errCmp);
                        res.status(500).json(errCmp);
                        return;
                    } else {
                        res.status(200).json(responseFromCampaigns(campaignsOfUser));
                        return;
                    }
                });
            } else {
                var messageError = "User " + userid + " does not exists";
                console.log('-- getCampaignsObjectsOfUser: ', messageError);
                res.status(404).json(messageError);
                return;
            }
        }
    });
};


    
/**
 * Get all campaigns for a certain user with campaign manager role
 * 
 * @param req.tokenDecoded.uid
 * @returns list of campaigns
 */
module.exports.getManagedCampaigns = function (req, res) {
    getCampaigns(req.tokenDecoded.uid, true, function (error, campaigns){
        if (error){
            console.log('-- getManagedCampaigns: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- getManagedCampaigns: end');
    });
};

/**
 * Get campaigns of user
 * 
 * @param req.tokenDecoded.uid
 * @returns list of campaigns
 */
module.exports.getMyCampaigns = function (req, res) {
    getCampaigns(req.tokenDecoded.uid, false, function (error, campaigns){

        if (error){
            console.log('-- getMyCampaigns: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- getMyCampaigns: end');
    });
};

/**
 * Gets campaigns from a list of campaign ids
 * 
 * @param req.query.campaignIds list of campaignid's
 * @returns list of campaigns
 */
module.exports.getCampaignsByListOfIds = function (req, res) {
    var campaignIds = JSON.parse(req.query.campaignIds);
    var query = { _id : { $in : campaignIds } };
    campaignDb.find(query, function(errCmp, campaigns){
        if (errCmp){
            console.log('-- getCampaignsByListOfIds: ' + errCmp);
            res.status(500).json(errCmp);
            return;
        } else {
            res.status(200).json(responseFromCampaigns(campaigns));
            return;
        }
    });
};

/**
 * Gets users from a campaign
 * 
 * @param req.params.campaignid
 * @returns list of users
 */
module.exports.getUsersOfCampaign = function (req, res) {
    var campaignId = req.params.campaignid;
    campaignDb.findById(campaignId, function (err, campaign){
        if (err){
            console.log('-- getUsersOfCampaign: ' + err);
            res.status(500).json(err);
            return;
        } else {
            var usersBlackList = [];
            if (campaign.usersToIgnoreFromStats !== undefined) {
                usersBlackList = campaign.usersToIgnoreFromStats;
            }
            console.log("-- getUsersOfCampaign: Users in black list: ", usersBlackList);
            var query = {"userid" : { $in : campaign.usersOnCampaign, $nin : usersBlackList} };
            usersDB.find(query, function(errUsersDb, usersOfCampaign) {
                if (errUsersDb){
                    console.log('-- getUsersOfCampaign: ' + errUsersDb);
                    res.status(500).json(errUsersDb);
                    return;
                } else {
                    res.status(200).json(usersOfCampaign);
                }
            });
        }
    });
};


/**
 * Finds an user using @param userEmail and adds him to a campaign with @param campaignId
 * @returns callback call
 */
var addManuallyUserToTheCampaign = function(campaignId, userEmail, callback){
    usersDB.findOne({email: userEmail}, function(errFindUser, user) {
        if (errFindUser){
            console.log('-- addManuallyUserToTheCampaign: ' + errFindUser);
            return callback(errFindUser, null, null, null);
        }
        if (user === null){
            return callback(null, userEmail, null, null);
        } 
        if (user.onCampaigns.indexOf(campaignId) > -1){
            return callback(null, null, userEmail, null);
        }
        var queryUsr = {"userid" : user.userid};
        var updateUsr = {$push: {onCampaigns: campaignId}};
        var optionsUsr = {new : true};
        if (user.userSettings !== undefined){
            var newVersion = user.userSettings.version + 1;
            var updateUsr = {$push: {"onCampaigns": campaignId}, $set: {"userSettings.version": newVersion}};
        }
        usersDB.findOneAndUpdate(queryUsr, updateUsr, optionsUsr, function(errUpdateUser, updatedUser){
            if (errUpdateUser){
                console.log('-- addManuallyUserToTheCampaign: ' + errUpdateUser);
                return callback(errUpdateUser, null, null, null);
            }
            var queryCmp = {"_id" : campaignId};
            var updateCmp = {$push: {usersOnCampaign: user.userid}};
            var optionsCmp = {new : true};
            campaignDb.findOneAndUpdate(queryCmp, updateCmp, optionsCmp, function (errUpadateCmp, updatedCmp) {
                if (errUpadateCmp){
                    console.log('-- addManuallyUserToTheCampaign: ' + errUpadateCmp);
                    return callback(errUpadateCmp, null, null, null);
                }
                return callback(null, null, null, {"updatedCampaign": responseFromCampaign(updatedCmp), "updatedUser": updatedUser});
            })
        });
    });
};

/**
 * Adds new user to campaign
 * 
 * @param req.body.campaignId
 * @param req.body.emailOfUser uses email
 * @returns status code
 */
module.exports.addNewUserToCampaign = function(req, res) {
    var campaignId = req.body.campaignId;
    var userEmail = req.body.emailOfUser;

    addManuallyUserToTheCampaign(campaignId, userEmail, function(internalError, unregisteredUser, userAlreadyInCampaign, updatedUserAndCampaign){
        if (internalError){
            console.log('-- addNewUserToCampaign: ' + internalError);
            res.status(500).json(internalError);
            return;
        } else if (unregisteredUser){
            var errorMessage = 'User with email ' + unregisteredUser + ' is not registered in the App';
            console.log('-- addNewUserToCampaign: ', errorMessage);
            res.status(202).json(errorMessage);
            return;
        } else if (userAlreadyInCampaign){
            var errorMessage = 'User with email ' + userAlreadyInCampaign + ' is already subscribed to this campaign';
            console.log('-- addNewUserToCampaign: ', errorMessage);
            res.status(202).json(errorMessage);
            return;
        }
        res.status(200).json(updatedUserAndCampaign);
    });
};

/**
 * Recursive function that adds multiple users (@param usersToAdd) to a campaign (@param campaignId)
 * @returns callback call
 */
var addUsersToCampaign = function(usersToAdd, campaignId, updatedUsers, updatedCampaign, unregisteredUsers, usersAlreadyInCampaign, callback) {
    if (usersToAdd.length === 0){
        callback(null, updatedCampaign, updatedUsers, unregisteredUsers, usersAlreadyInCampaign);
        return;
    } else {
        var currUserEmail = usersToAdd.shift();
        addManuallyUserToTheCampaign(campaignId, currUserEmail, function(internalError, unregisteredUser, userAlreadyInCampaign, updatedUserAndCampaign){
            if (internalError){
                console.log('-- addUsersToCampaign: ' + internalError);
                callback(internalError, null, null, null, null);
                return;
            } else if (unregisteredUser){
                unregisteredUsers.push(unregisteredUser);
            } else if (userAlreadyInCampaign){
                usersAlreadyInCampaign.push(userAlreadyInCampaign);
            } else if (updatedUserAndCampaign) {
                updatedUsers.push(updatedUserAndCampaign.updatedUser);
                updatedCampaign = updatedUserAndCampaign.updatedCampaign;
            }
            return addUsersToCampaign(usersToAdd, campaignId, updatedUsers, updatedCampaign, unregisteredUsers, usersAlreadyInCampaign, callback);
        });
    }
};

/**
 * Add multiple users to campaign
 * 
 * @param req.body.campaignId
 * @param req.body.emailsOfUsers
 */
module.exports.addMultipleUsersToCampaign = function(req, res) {
    var campaignId = req.body.campaignId;
    var emailsOfUsers = req.body.emailsOfUsers;
    console.log('-- addMultipleUsersToCampaign: Number of users to add = ', emailsOfUsers.length);
    var unregisteredUsers = [];
    var usersAlreadyInCampaign = [];
    var updatedUsers = [];
    var updatedCampaign = null;
    addUsersToCampaign(emailsOfUsers, campaignId, updatedUsers, updatedCampaign, unregisteredUsers, usersAlreadyInCampaign, 
            function(errorAddUsers, updatedCampaign, updatedUsers, unregisteredUsersList, usersAlreadyInCampaignList){
        if (errorAddUsers){
            console.log('-- addMultipleUsersToCampaign: ' + errorAddUsers);
            res.status(500).json(errorAddUsers);
            return;
        }
        console.log('-- addMultipleUsersToCampaign: num of unregistered users = ', unregisteredUsersList.length, " num of users already in campaign = ", usersAlreadyInCampaignList.length, " num of added users = ", updatedUsers.length);
        res.status(200).json({"updatedUsers": updatedUsers, "updatedCampaign": updatedCampaign, "unregisteredUsers": unregisteredUsersList, "alreadyInCampaign": usersAlreadyInCampaignList});
        return;
    });
};

/**
 * Exclude users from campaign
 * 
 * @param req.body.campaignId
 * @param req.body.emailOfUser
 */
module.exports.excludeUserFromCampaign = function (req, res) {
    var campaignId = req.body.campaignId;
    var userEmail = req.body.emailOfUser;
    usersDB.findOne({email: userEmail}, function(errFindUser, user) {
        if (errFindUser){
            console.log('-- excludeUserFromCampaign: ' + errFindUser);
            res.status(500).json(errFindUser);
            return;
        }
        if (user === null){
            var errorMessage = 'User with email ' + userEmail + ' is not registered in the App';
            console.log('-- excludeUserFromCampaign: ', errorMessage);
            res.status(202).json(errorMessage);
            return;
        } 
        if (!user.onCampaigns.includes(campaignId)){
            var errorMessage = 'User with email ' + userEmail + ' is not subscribed to this campaign';
            console.log('-- excludeUserFromCampaign: ', errorMessage);
            res.status(202).json(errorMessage);
            return;
        }
        var queryCmp = {"_id" : campaignId};
        campaignDb.findOne(queryCmp, function(errCmp, campaign) {
            if (errCmp){
                console.log('-- excludeUserFromCampaign: ' + errCmp);
                res.status(500).json(errCmp);
                return;
            }
            if (campaign.usersToIgnoreFromStats && campaign.usersToIgnoreFromStats.includes(user.userid)) {
                var errorMessage = 'User with email ' + userEmail + ' is already excluded from statistics this campaign';
                console.log('-- excludeUserFromCampaign: ', errorMessage);
                res.status(202).json(errorMessage);
                return;
            }
            var usersToIgnore = [];
            if (campaign.usersToIgnoreFromStats) {
                console.log("TEST: usersToIgnore already exists n = ", campaign.usersToIgnoreFromStats.length);
                usersToIgnore = campaign.usersToIgnoreFromStats;
            }
            usersToIgnore.push(user.userid);
            var updateCmp = {$set: {usersToIgnoreFromStats: usersToIgnore}};
            var optionsCmp = {new : true};
            campaignDb.findOneAndUpdate(queryCmp, updateCmp, optionsCmp, function (errUpadateCmp, updatedCmp) {
                if (errUpadateCmp){
                    console.log('-- excludeUserFromCampaign: ' + errUpadateCmp);
                    res.status(500).json(errUpadateCmp);
                    return;
                } else {
                    res.status(200).json({"updatedCampaign": responseFromCampaign(updatedCmp)});
                }
            });
        });
    });
};

/**
 * Get campaign by private code
 * 
 * @param req.params.privateCode
 */
module.exports.getCampaignByPrivateCode = function (req, res) {
    var query = {isPrivate: true, privateCode: req.params.privateCode};
    campaignDb.find(query, function(err, results) {
        if (err){
            res.status(500).json({error: err});
            return;
        }
        if (results.length < 1) {
            res.status(404).json({error: "Requested campaign does not exists"});
        } else {
            res.status(200).json(responseFromCampaign(results[0]));
        }
    });
};

/**
 * Verifies if a private code is available to use as a campaign private code
 * 
 * @param req.params.privateCode
 */
module.exports.validatePrivateCode = function (req, res) {
    validatePrivateCode(req.params.privateCode, function (error, isValidCode){
        if (error){
            console.log('-- validatePrivateCode: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(isValidCode);
        }
    });
};

/**
 * Creates a new campaign
 * 
 * @param req.body campaign object
 */
module.exports.newCampaign = function (req, res) {
    newCampaign(req.body, function (error, campaign){
        if (error){
            if (error === "PrivateCodeAlreadyInUse"){
                var err = "Specified private code is used already";
                console.log('-- newCampaign: ' + err);
                res.status(400).json({error: err});
                return;
            }
            console.log('-- newCampaign: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaign);
        }
        console.log('-- newCampaign: end');
    });
};

/**
 * Edits a campaign
 * 
 * @param req.body campaign object
 */
module.exports.editCampaign = function (req, res) {
    editCampaign(req.body, req.tokenDecoded.uid, function (error, campaigns){
        if (error){
            console.log('-- editCampaign: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- editCampaign: end');
    });
};

/**
 * Adds user to campaign
 * 
 * @param req.params.campaignId
 * @param req.tokenDecoded.uid
 */
module.exports.addUserCampaign = function (req, res) {
    addUserCampaign(req.params.campaignId, req.tokenDecoded.uid, function (error, campaigns){
        if (error){
            console.log('-- addUserCampaign: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- addUserCampaign: end');
    });
};

/**
 * Adds a Campaign Manager to a campaign
 * 
 * @param req.params.userid userid
 * @param req.tokenDecoded.uid userid
 * @param req.body campaignid
 */
module.exports.addManagerCampaign = function (req, res) {
    setUserCampaign(req.body, req.tokenDecoded.uid, req.params.userid, true, true, function (error, campaigns){
        if (error){
            console.log('-- addManagerCampaign: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- addManagerCampaign: end');
    });
};

/**
 * Remove user from campaign
 * 
 * @param req.body campaignId
 * @param req.tokenDecoded.uid
 * @param req.params.userid
 */
module.exports.removeUserCampaign = function (req, res) {
    setUserCampaign(req.body, req.tokenDecoded.uid, req.params.userid, false, false, function (error, campaigns){
        if (error){
            console.log('-- removeUserCampaign: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- removeUserCampaign: end');
    });
};

/**
 * Removes Campaign Manager from campaign
 * 
 * @param req.body campaignId
 * @param req.tokenDecoded.uid
 * @param req.params.userid
 */
module.exports.removeCMCampaign = function (req, res) {
    setUserCampaign(req.body, req.tokenDecoded.uid, req.params.userid, false, true, function (error, campaigns){
        if (error){
            console.log('-- removeCMCampaign: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- removeCMCampaign: end');
    });
};

/**
 * Deactivates campaign
 * 
 * @param req.body campaignId
 * @param req.tokenDecoded.uid
 */
module.exports.deactivateCampaign = function (req, res) {
    deactivateCampaign(req.body, req.tokenDecoded.uid, function (error, campaigns){
        if (error){
            console.log('-- deactivateCampaign: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- deactivateCampaign: end');
    });
};

/**
 * Reactivates campaign
 * 
 * @param req.body campaignId
 * @param req.tokenDecoded.uid
 */
module.exports.reactivateCampaign = function (req, res) {
    reactivateCampaign(req.body, req.tokenDecoded.uid, function (error, campaigns){
        if (error){
            console.log('-- reactivateCampaign: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(campaigns);
        }
        console.log('-- reactivateCampaign: end');
    });
};

/**
 * Adds user to campaign
 * 
 * @param {*} campaign campaign object
 * @param {*} uid userid
 */
module.exports.addUserCampaignByUserRequest = function (campaign, uid) {
    var query = {   "name" : campaign.name, 
                    "country" : campaign.country,
                    "city" : campaign.city,
                    "active" : true 
                };
    campaignDb.findOne(query, function (error, campaigns){
            if (error){
                console.log('-- addUserCampaignByUserRequest: ' + error);
                res.status(500).json(error);
                return;
            }else {
                addUserCampaign(campaigns._id, uid, function (error, campaigns){
                        if (error){
                            console.log('-- addUserCampaignByUserRequest: ' + error);
                            return;
                        } else {
                        }
                        console.log('-- addUserCampaignByUserRequest: end');
                    });
            }
    });
};
