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


var express = require('express');
var router = express.Router();
var usersController = require("../controllers/users");
var tripsController = require("../controllers/trips");
var weatherController = require("../controllers/weather");
var surveysController = require("../controllers/survey");
var campaignsController = require("../controllers/campaign");
var rewardController = require("../controllers/rewards");
var statsController = require("../controllers/stats");
var authentication = require("../authentication");

// router middleware, runs in the following requests
router.use(authentication.checkAuthentication);

// trips routes:
router.post("/trips", tripsController.createNewTrip);
router.delete("/trips/:tripid", tripsController.deleteTrip);

// weather routes:
router.get("/weather", weatherController.getWeather);

// users routes:
// new routes for User/UserSettings:
router.put("/users", usersController.updateUserInfo);
router.get("/users/user", usersController.getUserInfo);
router.get("/users/needsonboarding", usersController.needsOnboarding);
router.get("/users/:userid/roles", usersController.getUserRoles);

// old users routes:
router.post("/users", usersController.createNewUser);
router.get("/users/:userid", usersController.getUserInfoOld);
router.put("/users/:userid", usersController.updateUserInfoOld);
router.delete("/users/:userid", usersController.removeUser);
router.post("/users/settings", usersController.UpdateSettings);

// survey routes:
router.post("/surveys/answer", surveysController.saveAnswers);
router.post("/surveys/reporting", surveysController.saveReportingAnswers);
router.get("/surveys/reportingSurvey", surveysController.getReportingSurvey);
router.get("/surveys/:lastSurveyGlobalID", surveysController.getMySurveys);

// campaign
router.get("/campaigns", campaignsController.getMyCampaigns);
router.get("/campaigns/:country/:city", campaignsController.getCampaignsByCity);
router.get("/user/campaigns/objects", campaignsController.getCampaignsObjectsOfUser);
router.get("/campaigns/all", campaignsController.getAllCampaigns);
router.put("/campaign/adduser/:campaignId", campaignsController.addUserCampaign);
router.get("/campaign/:privateCode", campaignsController.getCampaignByPrivateCode);

// rewards
router.get("/rewards/my", rewardController.getMyRewards);
router.put("/rewards/status", rewardController.updateRewardStatus);

//stats
router.put("/rewards/statusAllTime", rewardController.updateRewardStatusAllTime);

//dashboard stats
router.get("/stats/globalStats", statsController.getStats);

//updates trips digests table
router.put("/tripSummaries", tripsController.updateTripDigests);

//--- admin-level routes:

//TODO: to be changed to admin router

// router.use(authentication.checkAdminPrivileges);
// TODO: update with Roles parameter:

module.exports = router;
