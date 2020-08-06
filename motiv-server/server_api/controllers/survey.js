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
 * Survey controller
 */
var mongoose = require('mongoose');
var databases = require('../models/databases');
const fs = require('fs');

var campaignDb = databases.campaignDbConnection.model('campaign');
var surveyDb = databases.SurveyDbConnection.model('Survey');
var questionDb = databases.SurveyDbConnection.model('Question');
var questionTypesDb = databases.SurveyDbConnection.model('QuestionTypes');
var surveyAnswersDb = databases.SurveyDbConnection.model('SurveyAnswers');
var reportAnswersCollection = databases.SurveyDbConnection.model('ReportingAnswers');
var eventTypeDb = databases.SurveyDbConnection.model('EventType');
var validator = require('../validators/validator');
var emailSender = require('../emailSender');
var usersCollection = mongoose.model('User');
var usersController = require('./users');
var authentication = require("../authentication");
var pushNotification = require('../pushnotifications/pushnotifications');

/**
 * Launch survey
 * 
 * @param {*} launch 
 */
var launchSurvey = function(launch) {
    usersController.getUsersForLaunchedSurveys(launch, function(error,users) {
        var registrationTokens = [];
        for(user in users){
            var token = users[user].pushNotificationToken;
            if (token != "") {
                registrationTokens.push(token);
            }
        }
        if(registrationTokens.length>0){
            pushNotification.sendUpdateMessage(registrationTokens);
        }
    });
}

/**
 * process question as sent from mongoDB
 * 
 * @param {*} resp 
 */
var responseToQuestion = function (resp) {
    var returnquestion = {};
    returnquestion.question = resp.question;
    returnquestion.answers = resp.answers;
    returnquestion.questionId = resp._id;
    returnquestion.questionType = resp.questionType;
    returnquestion.languageOfCreation = resp.languageOfCreation;
    returnquestion.deleted = resp.deleted;
    return returnquestion;
};

/**
 * process list of questions as sent from mongoDB
 * 
 * @param {*} questions 
 * @param {*} questionIDs 
 */
var responseToQuestions = function(questions, questionIDs) {
    var returnQuestions = [];
    if(questionIDs){    // questions of specific survey
        questionIDs.forEach( function(Id) {
            var question = questions.find(function(element){
                return element._id.toString() === Id; //_id is a buffer and has to be cast to String
            });
            if (question != undefined){
                returnQuestions.push(responseToQuestion(question));
            }
        });
    } else {    // all questions
        questions.forEach( function(question) {
            if (question != undefined){
                returnQuestions.push(responseToQuestion(question));
            }
        });
    }
    return returnQuestions;
};

/**
 * process survey as sent from mongoDB
 * 
 * @param {*} resp 
 * @param {*} callback 
 */
var responsetoSurvey = function (resp,callback){
    var returnSurvey = {};
    returnSurvey.surveyID = resp.surveyID;
    returnSurvey.defaultLanguage = resp.defaultLanguage;
    returnSurvey.surveyName = resp.surveyName;
    returnSurvey.description = resp.description;
    returnSurvey.estimatedDuration = resp.estimatedDuration;
    returnSurvey.surveyPoints = resp.surveyPoints;
    returnSurvey.version = resp.version;
    returnSurvey.globalSurveyTimestamp = resp.globalSurveyTimestamp;
    returnSurvey.startDate = resp.startDate;
    returnSurvey.stopDate = resp.stopDate;
    returnSurvey.deleted = resp.deleted;
    returnSurvey.urgent = resp.urgent;
    returnSurvey.surveyType = resp.surveyType;
    returnSurvey.campaigns = resp.campaigns;
    returnSurvey.trigger = resp.trigger;
    returnSurvey.launch = resp.launch;
    if(returnSurvey.launch) {
        returnSurvey.launch.launchID = returnSurvey.launch._id;
    }
    var query = {_id : { $in : resp.questions }, deleted: false };
    questionDb.find(query, function(error,questions){
        if (error){
            console.log("ResponsetoSurvey error: " + error);
            callback(error,null);
        }
        else {
            if (questions.length != 0) {
                returnSurvey.questions = responseToQuestions(questions, resp.questions);
                callback(null, returnSurvey);
            } else {
                returnSurvey.questions = [];
                callback(null,returnSurvey);
            }
        }
    });
};

/**
 * process list of surveys as sent from mongoDB
 * 
 * @param {*} surveys 
 * @param {*} callback 
 */
var responsetoSurveys = function(surveys, callback) {
    var returnSurveys = [];
    var i = 0;
    for (survey in surveys) {
        responsetoSurvey(surveys[survey], function(error,survey) {
            if (error){
                console.log("ResponsetoSurvey error: " + error);
                callback(error,null);
            } else {
                i++;
                if (survey !== null) {
                    returnSurveys.push(survey);
                }
                if(i === surveys.length){
                    callback(null,returnSurveys);
                }
            }
        });
    }
};

/**
 * get the next globalSurveyTimestamp
 * 
 * @param {*} callback 
 */
var getNextGlobalValue = function(callback){
    surveyDb.find().sort({"globalSurveyTimestamp":-1}).limit(1).exec( function(errorCheck, survey) {
        if (errorCheck){
            callback(errorCheck, null);
        } else {
            if (survey.length != 0) {
                callback(null, survey[0].globalSurveyTimestamp + 1);
            } else {
                callback(null,0);
            }
        }
   });
};

/**
 * Get next survey id value
 * 
 * @param {*} callback 
 */
var getNextSurveyIDlValue = function(callback){
    surveyDb.find().sort({"surveyID":-1}).limit(1).exec( function(errorCheck, survey) {
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            if (survey.length != 0) {
                callback(null, survey[0].surveyID + 1)
            } else {
                callback(null,0)
            }
        }
   });
};

/**
 * Create question
 * 
 * @param {*} newQuestion 
 * @param {*} callback 
 */
var createQuestion = function (newQuestion, callback) {
    questionDb.create(newQuestion, function (errorCheck, newQuestion){
        if (errorCheck){
            callback(errorCheck, null);
        } 
        else {
            console.log(responseToQuestion(newQuestion))
            callback(null,responseToQuestion(newQuestion))
        }
    });
};

//(only for delete!!!!)
var deleteQuestion = function (newQuesitonID, callback) {
    var query = {"_id" : newQuesitonID};
    var update = {$set:{"deleted" : true}};
    var options = {new : true};

    questionDb.findOneAndUpdate(query, update, options, function (errorCheck, question){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            if(question){
                callback(null, responseToQuestion(question))
            } else {
                callback(null, {})
            }
        }
    });
};

/**
 * Create survey
 * 
 * @param {*} newSurvey 
 * @param {*} callback 
 */
var createSurvey = function (newSurvey, callback) {
    getNextGlobalValue( function(errorCheck,gts) {
        if (errorCheck){
            callback(errorCheck, null);
        } else {
            newSurvey.globalSurveyTimestamp = gts;
            newSurvey.version = 1;
            getNextSurveyIDlValue( function(errorCheck,sid) {
                if (errorCheck){
                    callback(errorCheck, null);
                } else {
                    newSurvey.surveyID = sid;
                    surveyDb.create(newSurvey, function (errorCheck, newSurvey){
                        if (errorCheck){
                            callback(errorCheck, null);
                        }
                        else {
                            callback(null,newSurvey);
                        }
                    });
                }
            });
        }
    });
};

/**
 * Edit survey
 * 
 * @param {*} globalSurveyTimestamp 
 * @param {*} launch 
 * @param {*} callback 
 */
var editSurvey = function (globalSurveyTimestamp, launch, callback) {
    getNextGlobalValue( function(errorCheck,gts) {
        if (errorCheck){
            callback(errorCheck, null);
        } else {
            var query = {"globalSurveyTimestamp" : globalSurveyTimestamp};
            var update = 
                {$set:
                    {
                        "launch" : launch,
                        "globalSurveyTimestamp" : gts,
                    }
                };
            var options = {new : true};
            surveyDb.findOneAndUpdate(query, update, options, function (errorCheck, survey){
                if (errorCheck){
                    callback(errorCheck, null);
                }
                else {
                    callback(null,survey)
                    launchSurvey(launch)
                }
            });
        }
    });
};

/**
 * Get answers from survey id
 * 
 * @param {*} SurveyID 
 * @param {*} callback 
 */
var getAnswersFromSurveyID = function (SurveyID, callback) {
    var query = { "surveyID" : SurveyID };
    console.log("SID: " + SurveyID);
    surveyAnswersDb.find(query, function (errorCheck, answers){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            callback(null, answers);
        }
    });
};

/**
 * Get my surveys
 * 
 * @param {*} myUserID 
 * @param {*} globalID 
 * @param {*} callback 
 */
var getMySurveys = function (myUserID, globalID, callback) {
    var query = { "launch.users": myUserID, "globalSurveyTimestamp" : { $gt : globalID } }
    // get only last of that version
    surveyDb.find(query, function (errorCheck, surveys){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            if (surveys.length !== 0){
                responsetoSurveys(surveys, function(error,surveys){
                    if (error){
                        callback(error, null);
                    } else {
                        callback(null, {"surveys": surveys});
                    }
                });
            }
            else {
                callback(null, {"surveys": []});
            }
        }
    });
};

/**
 * Get my backoffice surveys
 * 
 * @param {*} myUserID 
 * @param {*} callback 
 */
var getMyBackofficeSurveys = function(myUserID, callback) {
    usersController.getMyRoles(myUserID, function(error, roles){
            var query = {};
            surveyDb.find(query, function(errorCheck, surveys){
                if (errorCheck){
                    callback(errorCheck, null);
                }
                else {
                    if (surveys.length !== 0){
                        responsetoSurveys(surveys,function(error,surveys){
                            if (error){
                                callback(error, null);
                            } else {
                                callback(null, surveys);
                            }
                        });
                    }
                    else {
                        callback(null, []);
                    }
                }
            });
    });
};

/**
 * Get my backoffice questions
 * 
 * @param {*} myUserID 
 * @param {*} callback 
 */
var getMyBackofficeQuestions = function(myUserID, callback) {
    usersController.getMyRoles(myUserID, function(error, roles){
            questionDb.find( function(errorCheck, questions){
                if (errorCheck){
                    callback(errorCheck, null);
                }
                else {
                    if (questions.length !== 0){
                        callback(null, responseToQuestions(questions, null));
                    }
                    else {
                        callback(null, []);
                    }
                }
            });
    });
};

/**
 * Get question types
 * 
 * @param {*} callback 
 */
var getQuestionTypes = function(callback) {
    questionTypesDb.find( function(errorCheck, types){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            if (types.length !== 0){
                callback(null, types);
            }
            else {
                callback(null, []);
            }
        }
    });
};

/**
 * Get events types
 * 
 * @param {*} callback 
 */
var getEventTypes = function(callback) {
    eventTypeDb.find( function(errorCheck, types){
        if (errorCheck){
            callback(errorCheck, null);
        }
        else {
            if (types.length !== 0){
                callback(null, types);
            }
            else {
                callback(null, []);
            }
        }
    });
};


/**
 * Create question
 * 
 * @param req.body question object
 */
module.exports.createQuestion = function (req, res) {
    createQuestion(req.body, function (error, question){
        if (error){
            console.log('-- createQuestion: ' + error);
            res.status(500).json(error);
            return;
        } else {
                res.status(200).json(question);
        }
        console.log('-- createQuestion: new question created');
    });
}

/**
 * Edit question
 * 
 * @param req.body question object
 */
module.exports.editQuestion = function (req, res) {
    var question = req.body;
    var query = {"_id" : question.questionId};
    var update = {$set:{"question" : question.question, "answers": question.answers}};
    var options = {new : true};
    questionDb.findOneAndUpdate(query, update, options, function (errorCheck, questionRes){
        if (errorCheck){
            console.log('-- editQuestion: error - ' + errorCheck);
            res.status(500).json(errorCheck);
            return;
        }
        else {
            console.log('-- editQuestion: question edited');
            res.status(200).json(questionRes);
        }
    });
};

/**
 * Delete question
 * 
 * @param req.params.questionID
 */
module.exports.deleteQuestion = function (req, res) {
    deleteQuestion(req.params.questionID, function (error, question){
        if (error){
            console.log('-- deleteQuestion: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(question);
        }
        console.log('-- deleteQuestion: question was deleted');
    });
};

/**
 * Create survey
 * 
 * @param req.body survey object
 */
module.exports.createSurvey = function (req, res) {
    createSurvey(req.body, function (error, survey){
        if (error){
            console.log('-- createSurvey: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(survey);
        }
        console.log('-- createSurvey: new survey created');
    });
};

/**
 * Edit before launch survey
 * 
 * @param req.params.surveyID
 * @param req.body survey object
 */
module.exports.editBeforeLaunchSurvey = function (req, res) {
    var surveyid = req.params.surveyID;
    surveyDb.findOneAndUpdate({"surveyID": surveyid}, req.body, {"new": true}, function(errUpdate, updatedSurvey){
        if (errUpdate){
            console.log('-- editBeforeLaunchSurvey: ' + errUpdate);
            res.status(500).json(errUpdate);
            return;
        } else {
            res.status(200).json(updatedSurvey);
        }
    });
}

/**
 * Edit survey
 * 
 * @param req.params.surveyID
 * @param req.body survey object
 */
module.exports.editSurvey = function (req, res) {
    editSurvey(req.params.surveyID ,req.body, function (error, survey){
        if (error){
            console.log('-- editSurvey: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(survey);
        }
        console.log('-- editSurvey: survey was edited');
    });
};

/**
 * Delete survey
 * 
 * @param req.params.surveyID
 */
module.exports.deleteSurvey = function (req, res) {
    var survId = req.params.surveyID;
    surveyDb.findOne({surveyID: survId}, function(errFind, existingSurvey){
        if (errFind){
            console.log('-- deleteSurvey: ' + errFind);
            res.status(500).json(errFind);
            return;
        } else {
            if (existingSurvey) {   // survey found
                getNextGlobalValue( function(errorCheck, gts) {
                    if (errorCheck){
                        console.log('-- deleteSurvey: ' + errorCheck);
                        res.status(500).json(errorCheck);
                        return;
                    } else {
                        var update = { $set: { "deleted" : true, "globalSurveyTimestamp": gts, "version": existingSurvey.version + 1 } };
                        var options = {new : true};
                        surveyDb.findOneAndUpdate({surveyID: survId}, update, options, function(errUpdate, updatedSurvey){
                            if (errUpdate){
                                console.log('-- deleteSurvey: ' + errUpdate);
                                res.status(500).json(errUpdate);
                                return;
                            } else {
                                responsetoSurvey(updatedSurvey, function(errResponse, surveyToSend){
                                    if (errResponse){
                                        console.log('-- deleteSurvey: ' + errResponse);
                                        res.status(500).json(errResponse);
                                        return;
                                    } else {
                                        console.log('-- deleteSurvey: survey ', survId, " was set as deleted");
                                        res.status(200).json(surveyToSend);
                                        return;
                                    }
                                });
                            }
                        });
                    }
                });
            } else {    // there is no survey
                var messageNotFound = "Survey " + survId + " does not exist";
                console.log('-- deleteSurvey: ' + messageNotFound);
                res.status(404).json(messageNotFound);
                return;
            }
        }
    });
};

/**
 * Get survey responses per campaign
 * 
 * @param req.params.campaignid
 */
module.exports.getSurveyResponsesPerCampaign = function (req, res) {
    var campaignId = req.params.campaignid;
    campaignDb.findById(campaignId, function (err, campaign){
        if (err){
            console.log('-- getSurveyResponsesPerCampaign: ' + err);
            res.status(500).json(err);
            return;
        } else {
            var usersBlackList = [];
            if (campaign.usersToIgnoreFromStats !== undefined) {
                usersBlackList = campaign.usersToIgnoreFromStats;
            }
            console.log("-- getSurveyResponsesPerCampaign: Users in black list: ", usersBlackList);
            var query = {"userid" : { $in : campaign.usersOnCampaign, $nin : usersBlackList} };
            usersCollection.find(query, function(errUsers, usersOfCampaign) {
                if (errUsers){
                    console.log('-- getSurveyResponsesPerCampaign: ' + errUsers);
                    res.status(500).json(errUsers);
                    return;
                } else {
                    var surveyQuery = {"launch.campaignIDs": campaignId};
                    surveyDb.find(surveyQuery, function(errSurvey, surveysOfCampaign) {
                        if (errSurvey){
                            console.log('-- getSurveyResponsesPerCampaign: ' + errSurvey);
                            res.status(500).json(errSurvey);
                            return;
                        } else {
                            var listOfSurveyids = [];
                            surveysOfCampaign.forEach(survey => {
                                listOfSurveyids.push(survey.surveyID);
                            });

                            var querySurveyAnswers = {"surveyID": {"$in" : listOfSurveyids}, "uid": {"$in": campaign.usersOnCampaign}};
                            var projectionSurveyAnswers = {"uid":1, "surveyID":1, "_id": 0};
                            surveyAnswersDb.find(querySurveyAnswers, projectionSurveyAnswers, function(errSurveyAnswers, surveyAnswers) {
                                if (errSurveyAnswers){
                                    console.log('-- getSurveyResponsesPerCampaign: ' + errSurveyAnswers);
                                    res.status(500).json(errSurveyAnswers);
                                    return;
                                } else {
                                    res.status(200).json({"usersOnCampaign": usersOfCampaign, "surveyAnswers": surveyAnswers});
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

/**
 * Get reporting answers
 * 
 * @param req.query.leftLimitTs
 * @param req.query.rightLimitTs
 */
module.exports.getReportingAnswers = function (req, res) {
    var leftLimitTs = JSON.parse(req.query.leftLimitTs);
    var rightLimitTs = JSON.parse(req.query.rightLimitTs);
    var query = {"answerDate": {$gte: leftLimitTs, $lte: rightLimitTs} }; 
    reportAnswersCollection.distinct('uid', query, function(errDistinct, uniqueUserids){
        if (errDistinct) {
            console.log('-- getReportingAnswers: ' + errDistinct);
            res.status(500).json(errDistinct);
            return;
        }
        else {
            usersCollection.find({"userid": {$in: uniqueUserids}}, function(errUsers, users){
                if (errUsers) {
                    console.log('-- getReportingAnswers: ' + errUsers);
                    res.status(500).json(errUsers);
                    return;
                } else {
                    reportAnswersCollection.find(query, null, {sort: {"answerDate": "descending"}}, function(err, reports){
                        if (err){
                            console.log('-- getReportingAnswers: ' + err);
                            res.status(500).json(err);
                            return;
                        } else {
                            res.status(200).json({"reports": reports, "users": users});
                        }
                    });
                }
            });
        }
    });
};

/**
 * Get questions by ids
 * 
 * Recursive
 * @param result questions {} - starts empty
 */
var getQuestionsByIds = function (ids, result, callback) {
    if (ids.length === 0){
        return callback(null, result);
    } else {
        var currQuestId = ids.shift(); // pop
        questionDb.findById(currQuestId, function(err, quest){
            if (err){
                return callback(err, null);
            } else {
                result[currQuestId] = quest;
                return getQuestionsByIds(ids, result, callback);
            }
        });
    }
};

/**
 * Get questions by ids
 * 
 * @param req.query.ids
 */
module.exports.getQuestionsByIds = function(req, res) {
    req.query.ids = JSON.parse(req.query.ids);      // parameter is array of IDs
    getQuestionsByIds(req.query.ids, {}, function(err, questions) {
        if (err){
            console.log('-- getQuestionsByIds: ' + err);
            res.status(500).json(err);
            return;
        } else {
            res.status(200).json(questions);
        }

    });
};

/**
 * Update reporting survey
 * 
 * @param req.params.reportid
 * @param req.body ReportingSurvey
 */
module.exports.updateReportingSurvey = function(req, res) {
    var repId = req.params.reportid;
    reportAnswersCollection.findByIdAndUpdate(repId, req.body, {new: true}, function(err, result){
        if (err){
            console.log('-- updateReportingSurvey: ' + err);
            res.status(500).json(err);
            return;
        } else {
            res.status(200).json(result);
        }
    });
};


/**
 * Get my surveys
 * 
 * @param req.tokenDecoded.uid
 * @param req.params.lastSurveyGlobalID
 */
module.exports.getMySurveys = function (req, res)  {
    if (!req.params.lastSurveyGlobalID){
        console.log('-- getMySurveys: lastSurveyGlobalID is missing in request');
        res.status(400).json({"status" : "lastSurveyGlobalID is missing in request"});
        return;
    }
    getMySurveys(req.tokenDecoded.uid,req.params.lastSurveyGlobalID, function (error, survey){
        if (error){
            console.log('-- getMySurveys: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(survey);
        }
        console.log('-- getMySurveys: surveys found and sent');
    });
};

/**
 * Save answers
 * 
 * @param req.body answers obj
 */
module.exports.saveAnswers = function (req, res) {
    if (! validator.validate.SURVEY_ANSWER(req.body) ){
        console.log('-- saveAnswers: Validator Error - ', validator.validate.SURVEY_ANSWER.errors);
        console.log('-- saveAnswers: Invalid Body - ', req.body);
        res.status(400).json({"error" : validator.validate.SURVEY_ANSWER.errors});
        return;
    }
    surveyAnswersDb.create(req.body, function (errorCheck, surveyAnswers){
        if (errorCheck){
            res.status(500).json({"error": errorCheck});
            return;
        }
        else {
            res.status(200).json({success: true});
            return;
        }
    });
};

/**
 * Save reporting answers
 * 
 * @param req.body Reporting answers obj
 */
var saveReportingAnswers = function(req, res) {
    if (! validator.validate.SURVEY_ANSWER(req.body) ){
        console.log('-- saveReportingAnswers: Validator Error - ', validator.validate.SURVEY_ANSWER.errors);
        console.log('-- saveReportingAnswers: Invalid Body - ', req.body);
        res.status(400).json({"error" : validator.validate.SURVEY_ANSWER.errors});
        return;
    }
    reportAnswersCollection.create(req.body, function (errorCheck, surveyAnswers){
        if (errorCheck){
            if ("attachmentFilename" in req.body){
                removeAttachmentByFilename(req.body.attachmentFilename);
            }
            res.status(500).json({"error": errorCheck});
            return;
        }
        else {
            res.status(200).json({success: true});
             // send email:
            var uid = surveyAnswers.uid;
            var reportId = surveyAnswers._id;
            usersCollection.findOne({"userid": uid}, function(errUsers, userInDb){
                if (errUsers){
                    res.status(500).json({"error": errUsers});
                    return;
                } else {
                    emailSender.sendEmailReportingReply(userInDb.email, reportId);
                }
            });
            return;
        }
    });
};
module.exports.saveReportingAnswers = saveReportingAnswers;

/**
 * Save reporting image
 * 
 * @param req.body.report
 * @param req.file.filename 
 */
module.exports.saveReportingImage = function(req, res) {
    var report = JSON.parse(req.body.report);
    if (req.file !== undefined){
        var filename = req.file.filename;
        report["attachmentFilename"] = filename;
    }
    req.body = report;
    saveReportingAnswers(req, res);
};

/**
 * Remove attachment by filename
 * 
 * @param {*} filename 
 */
var removeAttachmentByFilename = function(filename) {
    try {
        var filepath = process.env.PWD + "/reporting_images/" + filename;
        fs.unlinkSync(filepath);
        console.log('-- removeAttachmentByFilename: successfully deleted ' + filepath);
      } catch (err) {
        // TODO: handle the error
        console.log('-- removeAttachmentByFilename: ERROR: ' + err);
      }
};

/**
 * Get image of report by filename
 * 
 * @param req.params.filename
 */
module.exports.getImageOfReportByFilename = function(req, res) {
    var filename = req.params.filename;
    var ops = {
        root: process.env.PWD
    };
    res.header("Content-Type", "image/png");
    res.sendFile("reporting_images/" + filename, ops, function(err){
        if(err){
            console.log("-- getImageOfReportByFilename: Error: ", err);
            res.status(500).json(err);
        } else {
            console.log("-- getImageOfReportByFilename: image" + filename + "sent!");
        }
    });
};

/**
 * Get reporting survey
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getReportingSurvey = function (req, res) {
    var query = {"trigger.trigger" : "reporting"};
    surveyDb.find(query, function (errorCheck, surveys){
        if (errorCheck){
            console.log('-- getReportingSurvey: ' + errorCheck);
            res.status(500).json(errorCheck);
            return;
        }
        else {
            if (surveys.length !== 0){
                responsetoSurveys(surveys, function(error, surveys){
                    if (error){
                        console.log('-- getReportingSurvey: ' + error);
                        res.status(500).json(error);
                        return;
                    } else {
                        res.status(200).json({"surveys": surveys});
                        return;
                    }
                });
            }
            else {
                res.status(200).json({"surveys": []});
                return;
            }
        }
    });
};

/**
 * Get my backoffice surveys
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getMyBackofficeSurveys = function (req, res)  {
    getMyBackofficeSurveys(req.tokenDecoded.uid, function (error, survey){
        if (error){
            console.log('-- getMyBackofficeSurveys: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(survey);
            console.log('-- getMyBackofficeSurveys: surveys found and sent');
        }
    });
};

/**
 * Get my backoffice questions
 * 
 * @param req.params.surveyid
 * @param req.tokenDecoded.uid
 */
module.exports.getMyBackofficeQuestions = function (req, res)  {
    getMyBackofficeQuestions(req.tokenDecoded.uid, function (error, questions){
        if (error){
            console.log('-- getMyBackofficeQuestions: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(questions);
        }
        console.log('-- getMyBackofficeQuestions: questions found and sent');
    });
};

/**
 * Get qeustions types
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getQuestionTypes = function (req, res)  {
    getQuestionTypes(function (error, questionTypes){
        if (error){
            console.log('-- getQuestionTypes: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(questionTypes);
        }
        console.log('-- getQuestionTypes: questions found and sent');
    });
};

/**
 * Get event types
 * 
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getEventTypes = function (req, res)  {
    getEventTypes(function (error, questionTypes){
        if (error){
            console.log('-- getEventTypes: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(questionTypes);
        }
        console.log('-- getEventTypes: event Types sent');
    });
};

/**
 * Get answers from survey id
 * 
 * @param req.params.surveyid
 */
module.exports.getAnswersFromSurveyID = function (req, res)  {
    var SurveyID = req.params.SurveyID
    getAnswersFromSurveyID(SurveyID, function (error, answers){
        if (error){
            console.log('-- getAnswersFromSurveyID: ' + error);
            res.status(500).json(error);
            return;
        } else {
            res.status(200).json(answers);
            console.log('-- getAnswersFromSurveyID: AnswersSent');
        }
    });
};

/**
 * Get number of answers by survey id
 * 
 * @param req.params.surveyid
 */
module.exports.getNumberOfAnswersBySurveyid = function (req, res)  {
    var surveyid = req.params.surveyid;
    var query = {surveyID: surveyid};
    surveyAnswersDb.countDocuments(query, function(errCount, numOfAnswers) {
        if (errCount){
            console.log('-- getNumberOfAnswersBySurveyid: ' + errCount);
            res.status(500).json(errCount);
            return;
        } else {
            console.log("-- getNumberOfAnswersBySurveyid: answers found = ", numOfAnswers);
            res.status(200).json(numOfAnswers);
        }
    });
};

/**
 * Validate survey name
 * 
 * @param req.params.surveyName
 */
module.exports.validateSurveyName = function (req, res) {
    var surveyName = req.params.surveyName;
    console.log("Test: survey name to validate: ", surveyName);
    var query = {"surveyName": surveyName};
    surveyDb.findOne(query, function (errFindSurvey, foundSurvey){
        if (errFindSurvey) {
            console.log('-- validateSurveyName: ' + errFindSurvey);
            res.status(500).json(errFindSurvey);
            return;
        } 
        if (foundSurvey) {  // surveyName already exists
            var errorMessage = "survey named " + surveyName + " already exists";
            console.log('-- validateSurveyName: ', errorMessage);
            res.status(202).json(errorMessage);
            return;
        }
        else {  // surveyName is free
            res.status(200).json({});
            return;
        }
    });
};

/**
 * Updates surveys list of users
 * 
 * @param {*} callback 
 */
var updateUsersListOfSurveyByCampaigns = function(callback) {
    var updateSurveysWithUsersOfCampaigns = function (surveysAndUsers, callback) {   // recursive function
        if (surveysAndUsers.length === 0) {
            return callback(null, {status: "ok"});
        } else {
            var currSurvAndUsers = surveysAndUsers.shift(); // pop
            var survId = currSurvAndUsers["surveyid"];
            var usersList = currSurvAndUsers["users"];
            getNextGlobalValue(function(errorCheck, gts) {
                if (errorCheck){
                    console.log('-- updateUsersListOfSurveyByCampaigns: ' + errorCheck);
                    return callback(errorCheck, null);
                } else {
                    var update = {$addToSet: {"launch.users": {$each : usersList}}, $set: {"globalSurveyTimestamp": gts}};
                    surveyDb.findByIdAndUpdate(survId, update, function(errUpdate, updateResult){
                        if (errUpdate){
                            console.log('-- updateUsersListOfSurveyByCampaigns: ' + errUpdate);
                            return callback(errUpdate, null);
                        } else {
                            return updateSurveysWithUsersOfCampaigns(surveysAndUsers, callback);
                        }
                    });
                }
            });
        }
    };
    surveyDb.find({}, function(surveysErr, surveys){
        if (surveysErr){
            console.log('-- updateUsersListOfSurveyByCampaigns: ' + surveysErr);
            return callback(surveysErr, null);
        }
        var surveysToCheck = [];
        var campaignsOfsurveysToCheck = [];
        surveys.forEach( survey => {
            if (survey.launch !== undefined && survey.launch !== null){
                if (survey.launch.campaignIDs.length > 0){  // if has campaign as target
                    surveysToCheck.push(survey);
                    campaignsOfsurveysToCheck.push(...survey.launch.campaignIDs);
                }
            }
        });
        var campaignsOfsurveysToCheck = [...new Set(campaignsOfsurveysToCheck)];
        campaignDb.find({"_id": {$in : campaignsOfsurveysToCheck}}, function(errCamps, campaigns) {
            if (errCamps){
                console.log('-- updateUsersListOfSurveyByCampaigns: ' + errCamps);
                return callback(errCamps, null);
            }
            var campaignsById = {};
            campaigns.forEach( campaign => {
                campaignsById[campaign._id] = campaign;
            });
            var surveysToUpdate = [];
            surveysToCheck.forEach (survey => {
                console.log("-- updateUsersListOfSurveyByCampaigns: survey to check - ", survey.surveyID,
                             " with ", survey.launch.campaignIDs.length, " campaigns");
                survey.launch.campaignIDs.forEach(campaignId => {
                    var campaignObject = campaignsById[campaignId];
                    console.log("--> updateUsersListOfSurveyByCampaigns: campaign of survey - ", campaignObject._id, " isPrivate - ", campaignObject.isPrivate);
                    var privateCampaignsToUpdateNames = ["Belgium_Global", "Croatia_Global", "Finland_Global", "France_Global", "Italy_Global", "Norway_Global", "Portugal_Global", "Slovakia_Global", "Spain_Global", "Switzerland_Global", "Other_Global"];
                    // update only public and global campaigns:
                    if (!campaignObject.isPrivate || privateCampaignsToUpdateNames.includes(campaignObject.name)){
                        if (campaignObject.usersOnCampaign !== undefined && 
                            campaignObject.usersOnCampaign !== null && 
                            campaignObject.usersOnCampaign.length > 0) {
                                console.log("-->! updateUsersListOfSurveyByCampaigns: checking if campaign contains more users than survey survey ", survey.surveyID);
                            if (campaignObject.usersOnCampaign.length > survey.launch.users.length) {           // if has new users
                                console.log("-->!! updateUsersListOfSurveyByCampaigns: survey ", survey.surveyID, " will be updated!");
                                surveysToUpdate.push({
                                    "surveyid": survey._id,
                                    "users": campaignObject.usersOnCampaign
                                });
                            }
                        }
                    }
                });
            });
            // TODO: update surveys
            return updateSurveysWithUsersOfCampaigns(surveysToUpdate, callback);
        });
    });
};

/**
 * Updates surveys list of users
 */ 
module.exports.updateUsersInSurveys = function (req, res)  {
    updateUsersListOfSurveyByCampaigns(function(err, response){
        if (err){
            res.status(500).json(err);
            return;
        } else{
            res.status(200).json(response);
        }
    });
};