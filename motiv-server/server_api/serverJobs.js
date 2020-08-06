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
var cron = require('cron');
var request = require('request');
var stats = require('./controllers/stats');

var mongoose = require('mongoose');
var weatherDB = mongoose.model('Weather');

const citiesPRT = [
    {
        "name": "Lisbon",
        "id": "2267057"
    },
    {
        "name": "Porto",
        "id": "2735943"
    }
];

const citiesSVK = [
    {
        "name": "Žilina",
        "id": "3056508"
    },
    {
        "name": "Bratislava",
        "id": "3060972"
    },
    {
        "name": "Trnava",
        "id": "3057124"
    },
    {
        "name": "Nitra",
        "id": "3058531"
    },
    {
        "name": "Trenčín",
        "id": "3057140"
    },
    {
        "name": "Banská Bystrica",
        "id": "3061186"
    },
    {
        "name": "Košice",
        "id": "724443"
    },
    {
        "name": "Prešov",
        "id": "723819"
    }    
];

const citiesFIN = [
    {
        "name": "Helsinki",
        "id": "658226"
    },
    {
        "name": "Tampere",
        "id": "634963"
    },
    {
        "name": "Turku",
        "id": "633679"
    },
    {
        "name": "Oulu",
        "id": "643492"
    },
    {
        "name": "Etelä-Suomi", // !! is a region, not city!! -> fix: weather for city Kouvola (approx. center of region)
        "id": "650861"
    },
    {
        "name": "Länsi-Suomi", // !! is a region, not city!! -> fix: weather for city Ikaalinen (approx. center of region)
        "id": "656790"
    },
    {
        "name": "Keski-Suomi", // !! is a region, not city!! -> fix: weather for city Jyväskylä (approx. center of region)
        "id": "655195"
    },
    {
        "name": "Itä-Suomi",  // !! is a region, not city!! -> fix: weather for city Outokumpu (approx. center of region)
        "id": "830266" 
    },
    {
        "name": "Pohjois-Suomi", // !! is a region, not city!! -> fix: weather for city Oulu (approx. center of region)
        "id": "643485"
    }
];

const citiesESP = [
    {
        "name": "Barcelona",
        "id": "6356055"
    },
    {
        "name": "Girona",
        "id": "6534067"
    },
    {
        "name": "Tarragona",
        "id": "6361390"
    },
    {
        "name": "Lleida",
        "id": "6358863"
    }
];

const citiesBEL = [
    {
        "name": "Antwerp",
        "id": "2803139"
    },
    {
        "name": "Brugge",
        "id": "2800931"
    },
    {
        "name": "Brussels",
        "id": "3337389"
    },
    {
        "name": "Gent",
        "id": "2797657"
    },
    {
        "name": "Leuven",
        "id": "2792483"
    }
];

const citiesCHE = [
    {
        "name": "Lausanne",
        "id": "2659994"
    },
    {
        "name": "Genève",
        "id": "7285902"
    },
    {
        "name": "Montreux",
        "id": "2659601"
    },
    {
        "name": "Fribourg",
        "id": "7285870"
    },
    {
        "name": "Bern",
        "id": "2661552"
    },
    {
        "name": "Basel",
        "id": "7285161"
    },
    {
        "name": "Zurich",
        "id": "2657896"
    },
    {
        "name": "Neuchâtel",
        "id": "7286622"
    },
    {
        "name": "Yverdon-les-Bains",
        "id": "7287620"
    }
];

const citiesITA = [
    {
        "name": "Milan",
        "id": "6542283"
    }
];

const citiesFRA = [
    {
        "name": "Paris",
        "id": "2968815"
    },
    {
        "name": "Lyon",
        "id": "6454573"
    },
    {
        "name": "Grenoble",
        "id": "3014728"
    },
    {
        "name": "Nevers",
        "id": "6454385"
    },
    {
        "name": "Nantes",
        "id": "2990969"
    },
    {
        "name": "Bordeaux",
        "id": "6455058"
    },
    {
        "name": "Toulouse",
        "id": "6453974"
    },
    {
        "name": "Strasbourg",
        "id": "2973783"
    },
    {
        "name": "Amiens",
        "id": "3037854"
    },
    {
        "name": "Angers",
        "id": "6452361"
    },
    {
        "name": "Lille",
        "id": "6454414"
    },
    {
        "name": "Brest",
        "id": "3030300"
    },
    {
        "name": "Marseille",
        "id": "6447142"
    },
    {
        "name": "Saint Brieuc",
        "id": "2981280"
    },
    {
        "name": "Montpellier",
        "id": "6454034"
    }
];

const citiesNOR = [
    {
        "name": "Oslo",
        "id": "6453366"
    },
    {
        "name": "Bergen",
        "id": "3161732"
    },
    {
        "name": "Trondheim",
        "id": "3133881"
    },
    {
        "name": "Stavager",
        "id": "3137115"
    },
    {
        "name": "Drammen",
        "id": "6453372"
    },
    {
        "name": "Fredrikstad",
        "id": "3156529"
    },
    {
        "name": "Porsgrunn",
        "id": "3142657"
    },
    {
        "name": "Skien",
        "id": "6453383"
    },
    {
        "name": "Kristiansand",
        "id": "6453405"
    },
    {
        "name": "Ålesund",
        "id": "6453341"
    },
    {
        "name": "Tønsberg",
        "id": "6453389"
    }
];

const citiesHRV = [
    {
        "name": "Zagreb",
        "id": "3186886"
    },
    {
        "name": "Velika Gorica",
        "id": "3188244"
    },
    {
        "name": "Samobor",
        "id": "3191316"
    },
    {
        "name": "Zaprešić",
        "id": "3186781"
    },
    {
        "name": "Dugo selo",
        "id": "3201009"
    },
    {
        "name": "Zagrebačka županija",
        "id": "3337531"
    },
    {
        "name": "Split",
        "id": "3190261"
    },
    {
        "name": "Rijeka",
        "id": "3191648"
    },
    {
        "name": "Osijek",
        "id": "3193935"
    },
    {
        "name": "Varaždin",
        "id": "3188383"
    },
    {
        "name": "Zadar",
        "id": "3186952"
    }
];

var apiKey = "984ab076cd958f04689a0a4547189185";

/**
 * Updates the mongoDB weather table
 * @param countryCities list of cities
 */
var updateWeatherForCountry = function(countryCities) {
    var requestDate = new Date();
    countryCities.forEach(city => {
        var weatherUri = "http://api.openweathermap.org/data/2.5/forecast?units=metric&id=" + city.id + "&APPID=" + apiKey;
        request.get(weatherUri, function (error, response, body){
            if (!error && response.statusCode === 200) {
                var respJson = JSON.parse(body);
                // console.log("Resp jeson: ", respJson);
                var objToInsert = {
                    "city": city.name,
                    "weather": respJson.list[0],
                    "requestTimestamp": requestDate.getTime()
                };
                weatherDB.create(objToInsert, function(errCreate, createdWeatherObj){
                    if (errCreate){
                        console.log("-- jobUpdateWeather: Error " + errCreate);
                    } else {
                        console.log("-- jobUpdateWeather: weather for " + city.name + " updated at " + requestDate.toISOString());
                    }
                });
            } else {
                console.log("-- jobUpdateWeather: Request error for " + city.name + " - " + error);
            }
          });
    });
};

console.log('Before cron job instantiation');

var jobUpdateWeatherPRT = new cron.CronJob({
    cronTime: '0 49 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesPRT);
    } 
});

var jobUpdateWeatherSVK = new cron.CronJob({
    cronTime: '0 50 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesSVK);
    }
});

var jobUpdateWeatherFIN = new cron.CronJob({
    cronTime: '0 51 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesFIN)
    }
});

var jobUpdateWeatherESP = new cron.CronJob({
    cronTime: '0 52 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesESP);
    }
});

var jobUpdateWeatherBEL = new cron.CronJob({
    cronTime: '0 53 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesBEL);
    }
});

var jobUpdateWeatherCHE = new cron.CronJob({
    cronTime: '0 54 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesCHE);
    }
});

var jobUpdateWeatherITA = new cron.CronJob({
    cronTime: '0 55 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesITA);
    }
});

var jobUpdateWeatherFRA = new cron.CronJob({
    cronTime: '0 56 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesFRA);
    }
});

var jobUpdateWeatherNOR = new cron.CronJob({
    cronTime: '0 57 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesNOR);
    }
});

var jobUpdateWeatherHRV = new cron.CronJob({
    cronTime: '0 58 8,11,17 * * *',
    runOnInit : false,
    onTick: function() {
        updateWeatherForCountry(citiesHRV);
    }
});

/**
 * Returns a list of countries. Each country contains a name and a list of city names
 */
var getCountryList = function(){
    countries=[];
    country={};
    country["name"]="PRT";
    country["cities"]=[];
    for(var i = 0,size = citiesPRT.length; i<size;i++){
        country["cities"].push(citiesPRT[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="SVK";
    country["cities"]=[];
    for(var i = 0,size = citiesSVK.length; i<size;i++){
        country["cities"].push(citiesSVK[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="FIN";
    country["cities"]=[];
    for(var i = 0,size = citiesFIN.length; i<size;i++){
        country["cities"].push(citiesFIN[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="ESP";
    country["cities"]=[];
    for(var i = 0,size = citiesESP.length; i<size;i++){
        country["cities"].push(citiesESP[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="BEL";
    country["cities"]=[];
    for(var i = 0,size = citiesBEL.length; i<size;i++){
        country["cities"].push(citiesBEL[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="CHE";
    country["cities"]=[];
    for(var i = 0,size = citiesCHE.length; i<size;i++){
        country["cities"].push(citiesCHE[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="ITA";
    country["cities"]=[];
    for(var i = 0,size = citiesITA.length; i<size;i++){
        country["cities"].push(citiesITA[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="FRA";
    country["cities"]=[];
    for(var i = 0,size = citiesFRA.length; i<size;i++){
        country["cities"].push(citiesFRA[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="NOR";
    country["cities"]=[];
    for(var i = 0,size = citiesNOR.length; i<size;i++){
        country["cities"].push(citiesNOR[i]["name"]);
    }
    countries.push(country);
    country={};
    country["name"]="HRV";
    country["cities"]=[];
    for(var i = 0,size = citiesHRV.length; i<size;i++){
        country["cities"].push(citiesHRV[i]["name"]);
    }
    return countries;
}

/**
 * Returns a list of city names
 */
var getCityNamesList = function(){
    var cities=[]
    for(var i = 0,size = citiesPRT.length; i<size;i++){
        cities.push(citiesPRT[i]["name"]);
    }
    for(var i = 0,size = citiesSVK.length; i<size;i++){
        cities.push(citiesSVK[i]["name"]);
    }
    for(var i = 0,size = citiesFIN.length; i<size;i++){
        cities.push(citiesFIN[i]["name"]);
    }
    for(var i = 0,size = citiesESP.length; i<size;i++){
        cities.push(citiesESP[i]["name"]);
    }
    for(var i = 0,size = citiesBEL.length; i<size;i++){
        cities.push(citiesBEL[i]["name"]);
    }
    for(var i = 0,size = citiesCHE.length; i<size;i++){
        cities.push(citiesCHE[i]["name"]);
    }
    for(var i = 0,size = citiesITA.length; i<size;i++){
        cities.push(citiesITA[i]["name"]);
    }
    for(var i = 0,size = citiesFRA.length; i<size;i++){
        cities.push(citiesFRA[i]["name"]);
    }
    for(var i = 0,size = citiesNOR.length; i<size;i++){
        cities.push(citiesNOR[i]["name"]);
    }
    for(var i = 0,size = citiesHRV.length; i<size;i++){
        cities.push(citiesHRV[i]["name"]);
    }
    return cities;
}

/**
 * Updates full one-day stats for every user at 1am
 * These stats calcutation facilitate the execution of the following jobs
 */
var jobUpdateGlobalStats = new cron.CronJob({
    cronTime: '0 1 0 * * *',
    runOnInit : false,
    onTick: function() {
        stats.updateStatsPopulate(getCityNamesList());
        
    }
});

/**
 * Accumulates stats per user by time period (1 day, 3 days, 1 week ...)
 */
var jobUpdateUserGlobalStats = new cron.CronJob({
    cronTime: '0 35 0 * * *',
    runOnInit : false,
    onTick: function() {
        stats.updateUserSummary();
        
    }
});

/**
 * Accumulates stats per city and country by time period (1 day, 3 days, 1 week ...)
 */
var jobUpdateGlobalSummary = new cron.CronJob({
    cronTime: '0 45 0 * * *',
    runOnInit : false,
    onTick: function() {
        stats.updateSummaryTable(getCountryList());
    }
});

/**
 * Updates overall stats for every user
 * These stats consist on: all time number of trips and days with trips
 */
var jobUpdateUserTrips = new cron.CronJob({
    cronTime: '0 3 6,8,10,12,14,16,18,20,22 * * *',
    runOnInit : false,
    onTick: function() {
        stats.updateUserStats();
    }
});

console.log('After cron job instantiation');

jobUpdateWeatherPRT.start();
jobUpdateWeatherSVK.start();
jobUpdateWeatherFIN.start();
jobUpdateWeatherESP.start();
jobUpdateWeatherBEL.start();
jobUpdateWeatherCHE.start();
jobUpdateWeatherITA.start();
jobUpdateWeatherFRA.start();
jobUpdateWeatherNOR.start();
jobUpdateWeatherHRV.start();

//Stats
jobUpdateUserTrips.start();
jobUpdateGlobalStats.start();
jobUpdateGlobalSummary.start();
jobUpdateUserGlobalStats.start();

//----------------------------------------------------------------------TEST/POPULATE ONLY--------------------------------------------------------------

//updates user allTimeTrips and allTimeDaysWithTrips -> does not require any method to be run before
//stats.updateUserStats();

//------------------------------------------------------------------------------------------------------------------------------------------------------
//This method populates 1daystats. On stats.js change CURRENT_DAY and DAY_MAX:
//CURRENT_DAY -> how many days in the past, default=0 (today). Example for CURRENT_DAY = 2 -> 31JUL - CURRENT_DAY = 29JUL
//DAY_MAX -> chooses the limit day in the past. Example for DAY_MAX = 3,CURRENT_DAY=0 -> 31JUL - DAY_MAX = 28JUL -> means that it will run from 31jul until 29jul
//the number of cycles/days = DAY_MAX - CURRENT_DAY
//stats.updateStatsPopulate(getCityNamesList());

//------------------------------------------------------------------------------------------------------------------------------------------------------
//Single iteration of the method above. It only calculates for 1 day, and CURRENT_DAY can be used to set the specific day
//stats.updateStats(getCityNamesList(),function(error){});

//------------------------------------------------------------------------------------------------------------------------------------------------------
//Updates communities stats based on the records of 1daystats -> updateStatsPopulate or updateStats must be ran first
//stats.updateSummaryTable(getCountryList());

//------------------------------------------------------------------------------------------------------------------------------------------------------
//updates userSummary -> does not require any method to be run before this
//setTimeout(function after2sec(){stats.updateUserSummary();},2000); //timeout(wait) -> needed to establish con with bd

//-----------------------------------------------------------------
//updates dirty days
//stats.updateDirtyDays(getCityNamesList());

//-------------finds duplicated users and prints it ----
//stats.findDuplicatedUsers();
