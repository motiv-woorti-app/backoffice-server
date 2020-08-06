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

var userStats = new mongoose.Schema({ 
    userid: {type: String, required: true}, 
    numberTotalTrips: {type: Number, required: true},
    numberTotalDaysWithTrips: {type: Number, required: true},
});
var codeCount= new mongoose.Schema({ 
    code: {type: Number, required: true},
    count: {type: Number, required: true}
});
var codeValue = new mongoose.Schema({ 
    code: {type: Number, required: true},
    value: {type: Number, required: true}
});

var correctedMode = new mongoose.Schema({ 
    mode: {type: Number, required: true},
    distance: {type: Number, required: true},
    count: {type: Number, required: true},
    valueFromTripMode: {type: [codeValue], required: true},
    valueFromTripModeWSum: {type: [codeValue], required: true},
    valueFromTripModeCount: {type: [codeCount], required: true},
    wastedTimeMode: {type: Number, required: true},
    wastedTimeWSum: {type: Number, required: true},
    wastedTimeModeCount: {type: Number, required: true},
    duration: {type: Number, required: true},
    weightedSum: {type: Number, required: true}
});

var cityGlobalStats = new mongoose.Schema({ 
    city: {type: String, required: true},
    date: {type: Number, required: true},
    overallScoreCount: {type: Number, required: true},
    overallScoreTotal: {type: Number, required: true},
    totalDistance: {type: Number, required: true},
    totalUsers: {type: Number, required: true},
    totalDuration: {type: Number, required: true},
    totalLegs: {type: Number, required: true},
    wastedTimeTotal: {type: Number, required: true},
    wastedTimeTotalCount: {type: Number, required: true},
    valueFromTripTotal: {type: [codeValue], required: true},
    valueFromTripTotalCount: {type: [codeCount], required: true},
    correctedModes: {type: [correctedMode], required: true}
});

var summaryStats = new mongoose.Schema({
    name : {type: String, required: true},
    dateType : {type: String, required: true},
    geoType: {type: String, required: true},
    date: {type: Number, required: true},
    overallScoreCount: {type: Number, required: true},
    overallScoreTotal: {type: Number, required: true},
    totalDistance: {type: Number, required: true},
    totalDuration: {type: Number, required: true},
    totalUsers: {type: Number, required: true},
    totalLegs: {type: Number, required: true},
    wastedTimeTotal: {type: Number, required: true},
    wastedTimeTotalCount: {type: Number, required: true},
    valueFromTripTotal: {type: [codeValue], required: true},
    valueFromTripTotalCount: {type: [codeCount], required: true},
    correctedModes: {type: [correctedMode], required: true}
});

var userSummaryStats = new mongoose.Schema({
    userid : {type: String, required: true},
    dateType : {type: String, required: true},
    date: {type: Number, required: true},
    overallScoreCount: {type: Number, required: true},
    overallScoreTotal: {type: Number, required: true},
    totalDistance: {type: Number, required: true},
    totalDuration: {type: Number, required: true},
    totalLegs: {type: Number, required: true},
    wastedTimeTotal: {type: Number, required: true},
    wastedTimeTotalCount: {type: Number, required: true},
    valueFromTripTotal: {type: [codeValue], required: true},
    valueFromTripTotalCount: {type: [codeCount], required: true},
    correctedModes: {type: [correctedMode], required: true}
});

var campaignStats = new mongoose.Schema({ 
    campaign: {type: String, required: true},
    campaignid: {type: String, required: true},
    date: {type: Number, required: true},
    overallScoreCount: {type: Number, required: true},
    overallScoreTotal: {type: Number, required: true},
    totalDistance: {type: Number, required: true},
    totalDuration: {type: Number, required: true},
    totalLegs: {type: Number, required: true},
    totalUsers: {type: Number, required: true},
    wastedTimeTotal: {type: Number, required: true},
    wastedTimeTotalCount: {type: Number, required: true},
    valueFromTripTotal: {type: [codeValue], required: true},
    valueFromTripTotalCount: {type: [codeCount], required: true},
    correctedModes: {type: [correctedMode], required: true}
});

var dirtyDays = new mongoose.Schema({ 
    date: {type: Number, required: true}
});

mongoose.model('DirtyDays', dirtyDays);
mongoose.model('UserGlobalStats', userSummaryStats);
mongoose.model('CampaignStats', campaignStats);
mongoose.model('CityGlobalStats', cityGlobalStats);
mongoose.model('UserStats', userStats);
mongoose.model('SummaryStats', summaryStats);