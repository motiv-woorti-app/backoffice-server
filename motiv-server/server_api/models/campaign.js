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

var locationSchema = new mongoose.Schema({
    lon: {type: Number, required: true},
    lat: {type: Number, required: true}
});

var campaignSchema = new mongoose.Schema({ 
    name: {type: String, required: true},
    campaignDescription: {type: String},
    pointsTripPurpose: {type:Number, required: true},
    pointsTransportMode: {type:Number, required: true},
    pointsWorth: {type:Number, required: true},
    pointsActivities: {type:Number, required: true},
    pointsAllInfo: {type:Number, required: true},
    isPrivate: {type: Boolean, required: true},
    privateCode: {type: String, default: ""},
    country: {type: String, required: true},
    city: {type: String, required: true},
    radius: {type: Number, required: true},
    location: {type: locationSchema, required: true},
    active: {type: Boolean, default: true},
    usersOnCampaign: {type: [String], default: []}, 
    usersToIgnoreFromStats : {type: [String], default: []},
    campaignManagers: {type: [String], default: []}
});

var descriptionSchema = new mongoose.Schema({
    shortDescription:   {type: String, required: true},
    longDescription:    {type: String, required: false}
});

var rewardSchema = new mongoose.Schema({
    rewardName:         {type: String, required: true},
    targetCampaignId:   {type: String, required: true},
    startDate:          {type: Number, required: true},
    endDate:            {type: Number, required: true},
    targetType:         {type: Number, required: true},
    targetValue:        {type: Number, required: true},
    organizerName:      {type: String, required: true},
    linkToContact:      {type: String, required: false},
    removed:            {type: Boolean, required: true},
    defaultLanguage:    {type: String, required: true},
    descriptions:       {type: Map, of: descriptionSchema, required: true}
});

var rewardStatusSchema = new mongoose.Schema({
    userid:                     {type: String, required: true},
    rewardID:                   {type: String, required: true},
    currentValue:               {type: Number, required: true},
    rewardVersion:              {type: Number, required: true},
    hasShownPopup:              {type: Boolean},
    timestampsOfDaysWithTrips:  {type: [Number], required: true}
});

databases.campaignDbConnection.model('campaign', campaignSchema);
databases.campaignDbConnection.model('reward', rewardSchema);
databases.campaignDbConnection.model('rewardStatus', rewardStatusSchema);