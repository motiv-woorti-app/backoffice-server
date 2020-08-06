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

var modeOfTransportSettings = new mongoose.Schema({
    Mot: {type: Number, required: true},       
    MotText: {type: String, required: true},      
    motsProd: {type: Number, required: true}, 
    motsRelax: {type: Number, required: true},  
    motsFit:   {type: Number, required: true}  
});

var StoryStateful = new mongoose.Schema({
    storyID: {type: Number},
    read: {type: Boolean},
    readTimestamp: {type: Number},
    availableTimestamp: {type: Number}
});

var CampaignScore = new mongoose.Schema({
    campaignID: {type: String}, 
    campaignScore: {type: Number}
});

var EngagementNotification = new mongoose.Schema({
    title: {type: String},
    text: {type: String},
    sent: {type: Number}
});

var Location = new mongoose.Schema({
    latitude: {type: Number},
    longitude: {type: Number}
})

var Address = new mongoose.Schema({
    address: {type: String},
    location: {type: Location}
})

var userSettings = new mongoose.Schema({
    version:                    {type: Number, required: true},   
    prodValue:                  {type: Number, required: true},   
    relValue:                   {type: Number, required: true},   
    actValue:                   {type: Number, required: true},    
    name:                       {type: String, required: true},  
    country:                    {type: String, required: true},   
    city:                       {type: String},                 
    minAge:                     {type: Number, required: true},    
    maxAge:                     {type: Number, required: true},     
    gender:                     {type: String, required: true},    
    degree:                     {type: String},                    
    homeAddress:                {type: Address},
    workAddress:                {type: Address},
    seenBateryPopup:            {type: Boolean},
    preferedMots:               {type: [modeOfTransportSettings], required: true},   
    hasSetMobilityGoal:         {type: Boolean},
    mobilityGoalChosen:         {type: Number},
    mobilityGoalPoints:         {type: Number},
    lang:                       {type: String},
    maritalStatusHousehold:     {type: String},
    numberPeopleHousehold:      {type: String},
    yearsOfResidenceHousehold:  {type: String},
    labourStatusHousehold:      {type: String},
    stories:                    {type: [StoryStateful]},
    pointsPerCampaign:          {type: [CampaignScore]},
    chosenDefaultCampaignID:    {type: String},
    hasGoneToDashboard:         {type: Boolean},
    hasReportedTrip:            {type: Boolean},
    dontShowTellUsMorePopup:    {type: Boolean},
    dontShowBlockPopup:         {type: Boolean},
    lastSummarySent:            {type: Number},
    engagementNotifications:    {type: [EngagementNotification]}
});

var userSchema = new mongoose.Schema({ 
    userid:                 {type: String, required: true, unique: true},    
    email:                  {type: String, required: true},     
    registerTimestamp:      {type: Number},                     
    roles :                 {type : [String], required : true}, 
    pushNotificationToken:  {type: String},                     
    onCampaigns:            {type: [String], required: true},   
    managesCampaigns:       {type: [String], required: true},  
    userSettings:           {type: userSettings}                
});

var userSettingsSchemaOld = new mongoose.Schema({
    userid: {type: String, required: true},
    prodValue: {type: Number},
    relValue: {type: Number},
    actValue: {type: Number},
    preferedMots: {type: [modeOfTransportSettings]},
    name: {type: String, required: true},
    country: {type: String, required: true},
    city: {type: String},
    minAge: {type: Number, required: true},
    maxAge: {type: Number, required: true},
    gender: {type: String, required: false},
    degree: {type: String, required: false},
});

mongoose.model('User', userSchema);
mongoose.model('UserSettings', userSettingsSchemaOld);