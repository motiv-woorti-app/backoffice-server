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
var surveysController = require("../controllers/survey");
var campaignsController = require("../controllers/campaign");
var rewardController = require("../controllers/rewards");
var usersController = require("../controllers/users");
var tripsController = require("../controllers/trips");
var authentication = require("../authentication");
var multer  = require('multer');
var multerUpload = multer({ dest: 'reporting_images', limits: { fileSize: 600000 } });

// router middleware, runs in the following requests
router.use(authentication.checkAuthentication);

// Campaigns
router.use(authentication.checkCMorManagerOrAdminPrivileges); 
router.get("/campaigns/managed", campaignsController.getManagedCampaigns);
router.get("/campaigns/my", campaignsController.getMyCampaigns);
router.get("/campaigns/ids", campaignsController.getCampaignsByListOfIds);
router.get("/campaigns/statistics/answers/:campaignid", surveysController.getSurveyResponsesPerCampaign); // supports black list of users
router.get("/campaign/users/:campaignid", campaignsController.getUsersOfCampaign);
router.put("/campaign", campaignsController.editCampaign);
router.put("/campaign/addnewuser", campaignsController.addNewUserToCampaign);
router.put("/campaign/excludeuser", campaignsController.excludeUserFromCampaign);
router.put("/campaign/addmultipleusers", campaignsController.addMultipleUsersToCampaign);
router.put("/campaign/deactivate/", campaignsController.deactivateCampaign);
router.put("/campaign/reactivate/", campaignsController.reactivateCampaign);
router.post("/campaign", campaignsController.newCampaign);
router.get("/campaign/codecheck/:privateCode", campaignsController.validatePrivateCode);   

// Rewards
router.post("/rewards", rewardController.createNewReward);
router.get("/rewards/active/campaigns", rewardController.getCampaignIdsWithActiveReward);
router.get("/rewards", rewardController.getExistingRewards);
router.get("/rewards/:rewardId", rewardController.getRewardById);
router.get("/rewards/status/:rewardId", rewardController.getRewardStatus);
router.put("/rewards/:rewardId", rewardController.editReward);

// Surveys for CM, Manager
router.get("/surveys/answer/:SurveyID", surveysController.getAnswersFromSurveyID);
router.get("/surveys/answers/number/:surveyid", surveysController.getNumberOfAnswersBySurveyid);
router.get("/surveys/validation/:surveyName", surveysController.validateSurveyName);
router.get("/surveys", surveysController.getMyBackofficeSurveys);
router.post("/surveys", surveysController.createSurvey);
router.put("/surveys/launch/:surveyID", surveysController.editSurvey);        
router.put("/surveys/:surveyID", surveysController.editBeforeLaunchSurvey);
router.delete("/surveys/remove/:surveyID", surveysController.deleteSurvey);
router.get("/surveys/reportingAnswers", surveysController.getReportingAnswers);

// Survey Questions
router.get("/survey/questions", surveysController.getMyBackofficeQuestions); 
router.post("/survey/questions", surveysController.createQuestion); 
router.put("/survey/questions/:questionID", surveysController.editQuestion); 
router.delete("/survey/questions/:questionID", surveysController.deleteQuestion);

// Event Arrays
router.get("/survey/questionTypes", surveysController.getQuestionTypes)
router.get("/survey/eventTypes", surveysController.getEventTypes)  

// Trips
router.get("/trips/longtrips", tripsController.getLongTripsSummary);
router.get("/trips/summary", tripsController.getTripsSummary);
router.get("/trips/summary/:tripid", tripsController.getTripInfo);
router.get("/trips/campaign/summary", tripsController.getTripsSummaryByCampaign);
router.get("/trips/legsStartEnd", tripsController.getLegsStartEnd);
router.get("/trips/campaign/modeStatistics", tripsController.getTripsForModeStatistics);

// Users
router.get("/users", usersController.getAllUsers);
router.get("/users/ids", usersController.getUsersByListOfIds);

router.get("/tripdata", tripsController.getTripData);
router.get("/userdata", usersController.getUserData);
router.get("/tripsofusersdata", tripsController.getTripsOfUsersData);

router.get("/legalfiles", authentication.getLegalFiles);

// ------------------------------------------------------  ADMIN only: ----------------------------------------------------
router.use(authentication.checkAdminPrivileges);
                         
// Surveys for Admin:
router.get("/surveys/questionsByIds", surveysController.getQuestionsByIds);
router.post("/surveys/reportingwithfile", multerUpload.single('file'), surveysController.saveReportingImage);
router.get("/surveys/reporting/reportimage/:filename", surveysController.getImageOfReportByFilename);
router.put("/surveys/reporting/:reportid", surveysController.updateReportingSurvey);
router.get("/surveys/updateusers", surveysController.updateUsersInSurveys);

// users
router.put("/users/:userid", usersController.updateRoles);

router.get("/tripDigests", tripsController.getTripDigests);

module.exports = router;
