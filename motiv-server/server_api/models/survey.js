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


var mongoose = require( 'mongoose' );
var databases = require('./databases');

var launchSchema = new mongoose.Schema({ 
    users : [String],
    launchID: {type: String},
    launchDate: {type: Number},
    ageMin: {type: Number},
    ageMax: {type: Number},
    campaignIDs: {type: [String]},
});

var questionSchema = new mongoose.Schema({ 
    question: {type: mongoose.Schema.Types.Mixed, required: true},
    answers: {type: mongoose.Schema.Types.Mixed},
    languageOfCreation: {type: String},
    deleted: {type: Boolean, default: false},
    questionType: {type: String, enum: ['shortText', 'multipleChoice','scale','checkboxes','paragraph','dropdown','yesNo']}
});

var surveySchema = new mongoose.Schema({ 
    surveyID: {type: Number, required: true},
    defaultLanguage: {type: String, required: true},
    surveyName: {type: String, required: true},
    description: {type: String},
    estimatedDuration: {type: Number},
    surveyPoints: {type: Number, required: true},
    version: {type: Number, required: true},
    globalSurveyTimestamp: {type: Number, required: true, index: true},
    startDate: {type: Number, required: true},
    stopDate: {type: Number, required: true},
    deleted: {type: Boolean, default: false},
    urgent: {type: Boolean, default: false},
    surveyType: {type: String, enum: ['closed','open','intermediate'] },
    campaigns: [Number],
    trigger: mongoose.Schema.Types.Mixed,
    launch: launchSchema,
    questions: [String],
    edited: {type: Boolean, default: false}
});

var answerSchema = new mongoose.Schema({
    questionID: {type: String, required: true},
    questionType: {type: String, enum: ['shortText', 'multipleChoice','scale','checkboxes','paragraph','dropdown','yesNo'], required: true},
    answer: {type: mongoose.Schema.Types.Mixed, required: true}
});

var surveyAnswerSchema = new mongoose.Schema({
    version: {type: Number, required: true},
    surveyID: {type: Number, required: true},
    uid: {type: String, required: true},
    triggerDate: {type: Number, required: true},
    answerDate: {type: Number, required: true},
    lang: {type: String, required: true},
    answers: {type: [answerSchema], required: true}
});

var reportSurveyAnswerSchema = new mongoose.Schema({
    version: {type: Number, required: true},
    surveyID: {type: Number, required: true},
    uid: {type: String, required: true},
    triggerDate: {type: Number, required: true},
    answerDate: {type: Number, required: true},
    lang: {type: String, required: true},
    answers: {type: [answerSchema], required: true},

    reportingID : {type: String, default: ""},
    reportingOS: {type: String, default: ""},
    analysedDate: {type: Number},
    addressedDate: {type: Number},
    comments: {type: String},
    reportedByWeb: {type: Boolean},
    relativePriority: {type: Number},
    attachmentFilename: {type: String}
});

var QuestionTypesSchema = new mongoose.Schema({
    id: {type: Number, required: true},

})

var ComboboxTypeSchema = new mongoose.Schema({
    id: {type: Number, required: true},
    type: {type: String, required: true},
    name: {type: String, required: true},
})

databases.SurveyDbConnection.model('Survey', surveySchema);
databases.SurveyDbConnection.model('Question', questionSchema);
databases.SurveyDbConnection.model('SurveyAnswers', surveyAnswerSchema);
databases.SurveyDbConnection.model('ReportingAnswers', reportSurveyAnswerSchema);
databases.SurveyDbConnection.model('QuestionTypes', QuestionTypesSchema);
databases.SurveyDbConnection.model('EventType', ComboboxTypeSchema);