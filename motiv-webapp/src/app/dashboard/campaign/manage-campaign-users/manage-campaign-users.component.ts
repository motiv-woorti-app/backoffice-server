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
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {CampaignService, MotivCampaign} from "../../../providers/campaign.service";
import { FormControl, Validators } from '@angular/forms';
import { UtilsService } from 'src/app/providers/utils.service';

import * as moment from 'moment';
import { AuthService } from 'src/app/providers/auth.service';

@Component({
  selector: 'app-manage-campaign-users',
  templateUrl: './manage-campaign-users.component.html',
  styleUrls: ['./manage-campaign-users.component.css']
})

//Component responsible for managing one campaign and their users
export class ManageCampaignUsersComponent implements OnInit {

  columnsOfUserToShow = ["email", "registerDate", "name", "points", "numAnswers", "numOfTrips", "daysOfTrips", "lastSubmittedTrip"];

  usersEmails;
  usersEmailsBoolean=false;

  currentCampaign : MotivCampaign;
  usersInCampaign;

  emailError = undefined;
  emailOfUserToAdd = new FormControl('', [
    Validators.email,
    Validators.required
  ]);

  emailExcludeUserError = undefined;
  emailOfUserToExclude = new FormControl('', [
    Validators.email,
    Validators.required
  ]);

  emailManyError = undefined;
  listOfEmails = new FormControl('');
  emailManyResultStatus = undefined;

  overallStatistics;
  specificStatistics;

  numAnsweredSurveysPerUser;

  firstDaySpecificFilter;
  lastDaySpecificFilter;



  constructor(
    private route: ActivatedRoute,
    private campaignService: CampaignService,
    private utilsService: UtilsService,
    private authService: AuthService  // used in html
  ) { }

  ngOnInit() {
    var currentCampaignId = this.route.snapshot.params['campaignid'];

    this.currentCampaign = this.campaignService.getManagedCampaignByID(currentCampaignId);

    this.campaignService.getUsersAndAnswersOfCampaign(this.currentCampaign.campaignId).then( (usersAndAnswers) => {
      this.usersInCampaign = usersAndAnswers["usersOnCampaign"];  
      this.calculateAnswersPerUser(usersAndAnswers["surveyAnswers"]);

    });
    

    this.campaignService.getCampaignsStatisticsByID(-1, -1, this.currentCampaign.campaignId).then( (campaignStatistics) => {

      this.overallStatistics = this.calculateStatistics(campaignStatistics);
      this.usersInCampaign.sort(this.orderUsersInCampaign.bind(this));
    });
  }

  /**
   * Order users in campaign
   * 
   * @param a 
   * @param b 
   */
  orderUsersInCampaign(a,b){
    var idA = a["_id"];
    var idB = b["_id"];
    if(idA < idB) { return 1; }
    if(idA > idB) { return -1; }
    return 0;
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Calculate answers per user
   */
  calculateAnswersPerUser(surveyAnswers) {
    var numAnsweredSurveysPerUser = {};
    surveyAnswers.forEach(answerOfUser => {
      if (numAnsweredSurveysPerUser[answerOfUser.uid] === undefined){  // new user with answers
        numAnsweredSurveysPerUser[answerOfUser.uid] = 0;    // initialization
      }
      numAnsweredSurveysPerUser[answerOfUser.uid] += 1;
    });
    this.numAnsweredSurveysPerUser = numAnsweredSurveysPerUser;
  }

  /**
   * Export mode statistics
   * 
   * @param isCsv 
   */
  exportModeStatistics(isCsv){
    this.campaignService.getTripsForModeStatistics(this.currentCampaign.campaignId).then( (tripsObject) => {
      var modeStatistics = this.calculateModeStatistics(tripsObject["trips"]);
      
      var filename = "ModeStatistics" + this.currentCampaign.name;
      const link = document.createElement('a');
      document.body.appendChild(link);
      var blob;
      if(!isCsv){
        blob = new Blob([JSON.stringify(modeStatistics, null, 2)], { type: 'octet/stream' });
        link.download = filename + ".json";
      }
      else{
        var content = "mode,distance (m),duration (ms),number of legs\n";
        for(var i=0;i<modeStatistics.length;i++){
          content+=this.utilsService.getTransportModeName(modeStatistics[i].mode)+","+modeStatistics[i].distance+","+modeStatistics[i].duration+","+modeStatistics[i].numLegs+"\n";
        }
        var csv = content;
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;base64' });
        link.download = filename + ".csv";
      }
      
      var url = window.URL.createObjectURL(blob);
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    });
  }
  
  /**
   * Calculate mode statistics
   * 
   * @param trips 
   */
  calculateModeStatistics(trips){
    var distanceByMode = {};
    var durationByMode = {};
    var numLegsByMode = {};
    var returnArray = [];
    for(var i=0;i<trips.length;i++){
      var trip=trips[i];
      for(var h=0; h<trip.legs.length;h++){
        var leg = trip.legs[h]
        var currLegDuration = leg.endDate - leg.startDate;
        if(currLegDuration<0){
          continue;
        }
        if (distanceByMode[leg.correctedModeOfTransport]){
          distanceByMode[leg.correctedModeOfTransport]  += leg.distance;
        } else {
          distanceByMode[leg.correctedModeOfTransport] = leg.distance;
        }
        // duration
        if (durationByMode[leg.correctedModeOfTransport]){
          durationByMode[leg.correctedModeOfTransport]  += currLegDuration;
        } else {
          durationByMode[leg.correctedModeOfTransport] = currLegDuration;
        }
        // numLegs
        if (numLegsByMode[leg.correctedModeOfTransport]){
          numLegsByMode[leg.correctedModeOfTransport]++;
        } else {
          numLegsByMode[leg.correctedModeOfTransport] = 1;
        }
      };
    };
    var distanceByModeKeys = Object.keys(distanceByMode);
    distanceByModeKeys.forEach(elem => {
      returnArray.push({
        "mode": elem,
        "distance": distanceByMode[elem],
        "duration": durationByMode[elem],
        "numLegs": numLegsByMode[elem]
      });
    })
    return returnArray;
  }

  /**
   * Calculate statistics
   * 
   * @param campaignStatistics 
   */
  calculateStatistics(campaignStatistics) {    
    var resStats = {};
    resStats["numTrips"] = campaignStatistics["tripsOfUsers"].length;
    resStats["numUsers"] = campaignStatistics["users"].length;
    var genders = [{originalGender:"Male",correctGender:"Male"},{originalGender:"Female",correctGender:"Female"},{originalGender:"Other",correctGender:"Other"},{originalGender:"Muško",correctGender:"Male"},{originalGender:"Man",correctGender:"Male"},{originalGender:"Male",correctGender:"Male"},{originalGender:"Mies",correctGender:"Male"},{originalGender:"Homme",correctGender:"Male"},{originalGender:"Männlich",correctGender:"Male"},{originalGender:"Uomo ",correctGender:"Male"},{originalGender:"Mann",correctGender:"Male"},{originalGender:"Masculino",correctGender:"Male"},{originalGender:"Muž",correctGender:"Male"},{originalGender:"Hombre",correctGender:"Male"},{originalGender:"Dona",correctGender:"Female"},{originalGender:"Žensko",correctGender:"Female"},{originalGender:"Vrouw",correctGender:"Female"},{originalGender:"Female",correctGender:"Female"},{originalGender:"Nainen",correctGender:"Female"},{originalGender:"Femme",correctGender:"Female"},{originalGender:"Weiblich",correctGender:"Female"},{originalGender:"Femmina",correctGender:"Female"},{originalGender:"Kvinne",correctGender:"Female"},{originalGender:"Feminino",correctGender:"Female"},{originalGender:"Žena",correctGender:"Female"},{originalGender:"Mujer",correctGender:"Female"},{originalGender:"Altres",correctGender:"Other"},{originalGender:"Drugo",correctGender:"Other"},{originalGender:"Andere",correctGender:"Other"},{originalGender:"Other",correctGender:"Other"},{originalGender:"Muu",correctGender:"Other"},{originalGender:"Autre",correctGender:"Other"},{originalGender:"Andere",correctGender:"Other"}]
    resStats["gender"] = {"Male": 0, "Female": 0, "Other": 0, "undefined": 0};
    var ageObj = {"16-19": 0, "20-24": 0, "25-29": 0,"30-39" :0, "40-49": 0, "50-64": 0, "65-74": 0, "75+": 0, "old": 0, "undefined": 0};
    var degreeObj = {"Unknown": 0};
    campaignStatistics["users"].forEach(element => {
      if (element.userSettings){
        // gender:
        for(var i=0;i<genders.length;i++){
          if(genders[i].originalGender==element.userSettings.gender){
            element.userSettings.gender=genders[i].correctGender;
            break;
          }
        }
        if (element.userSettings.gender === "Male" || element.userSettings.gender === "Female"){
          resStats["gender"][element.userSettings.gender] += 1;
        } else { // other values
          resStats["gender"]["Other"] += 1;
        }

        // age:
        if (element.userSettings.minAge === 16 && element.userSettings.maxAge === 19){
          ageObj["16-19"] += 1;
        }
        else if (element.userSettings.minAge === 20 && element.userSettings.maxAge === 24){
          ageObj["20-24"] += 1;
        }
        else if (element.userSettings.minAge === 25 && element.userSettings.maxAge === 29){
          ageObj["25-29"] += 1;
        }
        else if (element.userSettings.minAge === 30 && element.userSettings.maxAge === 39){
          ageObj["30-39"] += 1;
        }
        else if (element.userSettings.minAge === 40 && element.userSettings.maxAge === 49){
          ageObj["40-49"] += 1;
        }
        else if (element.userSettings.minAge === 50 && element.userSettings.maxAge === 64){
          ageObj["50-64"] += 1;
        }
        else if (element.userSettings.minAge === 65 && element.userSettings.maxAge === 74){
          ageObj["65-74"] += 1;
        }
        else if (element.userSettings.minAge >= 75 && element.userSettings.maxAge === 64){
          ageObj["75+"] += 1;
        } else {                        // values from old versions
          ageObj["old"] += 1;
        }

        // degree
        if (element.userSettings.degree === ""){
          degreeObj["Unknown"] += 1;
        } else {
          if (degreeObj[element.userSettings.degree]){
            degreeObj[element.userSettings.degree] += 1;
          } else {
            degreeObj[element.userSettings.degree] = 1;
          }
        }

      } else { // no userSettings
        resStats["gender"]["undefined"] += 1;
        ageObj["undefined"] += 1;
        degreeObj["Unknown"] += 1;
      }
    });
    var numLegs = 0;
    var distanceByMode = {};
    var durationByMode = {};
    var ageList = [
      {"age": "16-19", "count": ageObj["16-19"]},
      {"age": "20-24", "count": ageObj["20-24"]},
      {"age": "25-29", "count": ageObj["25-29"]},
      {"age": "30-39", "count": ageObj["30-39"]},
      {"age": "40-49", "count": ageObj["40-49"]},
      {"age": "50-64", "count": ageObj["50-64"]},
      {"age": "65-74", "count": ageObj["65-74"]},
      {"age": "75+", "count": ageObj["75+"]},
      {"age": "Old intervals", "count": ageObj["old"]},
      {"age": "Unknown", "count": ageObj["undefined"]}
    ];
    var degreeObjKeys = Object.keys(degreeObj);
    var degreeList = [];
    degreeObjKeys.forEach(elem => {
      degreeList.push({
        "name": elem,
        "count": degreeObj[elem]
      });
    });

    var distanceByModeKeys = Object.keys(distanceByMode);
    var distanceDurationByModeList = [];
    resStats["numLegs"] = numLegs;
    resStats["age"] = ageList;
    resStats["degree"] = degreeList;
    resStats["distancesAndDurations"] = distanceDurationByModeList;

    // calc different days with trips for each user:
    var differentDaysOfTripsPerUser = {};
    var numTripsPerUser = {};
    var lastTripOfUser = {};
    var numberOfTrips = 0;
    campaignStatistics["tripsOfUsers"].forEach(tripOfUser => {
      if (tripOfUser.startDate !== undefined){  // some records dont have start date
        var tripStartDateTs = moment(tripOfUser.startDate / 1000);    // moment accepts timestamp only in milliseconds! and the timestamp in db is stored in microseconds!
        
        // date of last trip: 
        if (lastTripOfUser[tripOfUser.userid] === undefined){
          lastTripOfUser[tripOfUser.userid] = tripStartDateTs.valueOf();
        } else {
          if (lastTripOfUser[tripOfUser.userid] < tripStartDateTs.valueOf()) {
            lastTripOfUser[tripOfUser.userid] = tripStartDateTs.valueOf();
          }
        }

        // num trips of each user and num different days with trips:
        tripStartDateTs.startOf('day'); // normalized date
        var normalizedTripStartDateTs = tripStartDateTs.valueOf();
        if (differentDaysOfTripsPerUser[tripOfUser.userid] === undefined){  // new user with trips
          differentDaysOfTripsPerUser[tripOfUser.userid] = new Set();
          numTripsPerUser[tripOfUser.userid] = 0;
        }
        differentDaysOfTripsPerUser[tripOfUser.userid].add(normalizedTripStartDateTs);
        numTripsPerUser[tripOfUser.userid] += 1;
        numberOfTrips++;
      }
    });
    var idsOfUsers = Object.keys(differentDaysOfTripsPerUser);
    var numUsersWithFourteenDaysWithTrips = 0;
    idsOfUsers.forEach(id => {
      differentDaysOfTripsPerUser[id] = Array.from(differentDaysOfTripsPerUser[id]); // transform to array
      if(differentDaysOfTripsPerUser[id]!=undefined && differentDaysOfTripsPerUser[id].length>=14){
        numUsersWithFourteenDaysWithTrips++;
      }
    });
    resStats["numUsersWithFourteenDaysWithTrips"] = numUsersWithFourteenDaysWithTrips;
    resStats["differentDaysOfTripsPerUser"] = differentDaysOfTripsPerUser;
    resStats["numTripsPerUser"] = numTripsPerUser;
    resStats["lastTripOfUser"] = lastTripOfUser;
    resStats["numTrips"]=numberOfTrips;
    console.log("trips total count: "+campaignStatistics["tripsOfUsers"].length);
    return resStats;
  }

  /**
   * Update statistics by specific week
   * 
   * @param selectedDate 
   */
  updateStatisticsBySpecificWeek(selectedDate) {
    var firstAndLastDay = this.utilsService.getWeekLimitsByWeekDay(selectedDate);

    this.firstDaySpecificFilter = firstAndLastDay["firstDay"];
    this.lastDaySpecificFilter = firstAndLastDay["lastDay"];

    var firstDayTs = firstAndLastDay["firstDay"].valueOf();
    var lastDayTs = firstAndLastDay["lastDay"].valueOf();

    this.campaignService.getCampaignsStatisticsByID(firstDayTs, lastDayTs, this.currentCampaign.campaignId).then( (campaignStatistics) => {
    this.specificStatistics = this.calculateStatistics(campaignStatistics);
    });
  }

  /**
   * Update statistics by specific month
   * 
   * @param selectedDate 
   */
  updateStatisticsBySpecificMonth(selectedDate) {
    
    this.firstDaySpecificFilter = selectedDate.clone().startOf("month");
    this.lastDaySpecificFilter = selectedDate.clone().endOf("month");

    var firstDayMonthTs = selectedDate.clone().startOf("month").valueOf();
    var lastDayMonthTs = selectedDate.clone().endOf("month").valueOf();

    this.campaignService.getCampaignsStatisticsByID(firstDayMonthTs, lastDayMonthTs, this.currentCampaign.campaignId).then( (campaignStatistics) => {
      this.specificStatistics = this.calculateStatistics(campaignStatistics);
    });
  }

  /**
   * Get distance in Km
   * 
   * @param distance 
   */
  getDistanceInKm(distance) {
    return (distance / 1000).toFixed(2) + " km";
  }

  /**
   * Get duration
   * 
   * @param durationInMilliseconds 
   */
  getDuration(durationInMilliseconds): string{
    var oneHourInMilliseconds = 3600000; // 1000×60×60
    var durationInHours = durationInMilliseconds/oneHourInMilliseconds;
    var hours = Math.floor(durationInHours);
    var minutes = (durationInHours % 1) * 60;
    var seconds = (minutes % 1) * 60;
    return hours + "h " + Math.round(minutes) + "m " + Math.round(seconds) + "s";
  }

  /**
   * Get name of user
   * 
   * @param user 
   */
  getNameOfUser(user) {
    if (user.userSettings !== undefined){
      return user.userSettings.name;
    } else {
      return "-";
    }
  }

  /**
   * Get points of user
   * 
   * @param user 
   */
  getPointsOfUser(user) {
    if (user.userSettings !== undefined){

      var currCmpPoints = undefined;
      var dummyCmpPoints = undefined;
      user.userSettings.pointsPerCampaign.forEach(element => {
        if (element.campaignID === this.currentCampaign.campaignId){
          currCmpPoints = element.campaignScore;
        } else if (element.campaignID === "dummyCampaignID") {
          dummyCmpPoints = element.campaignScore;
        }
      });
      if (currCmpPoints !== undefined){
        return currCmpPoints;
      }
    } 
    return 0;
  }

  /**
   * Get different days with trips of user
   * 
   * @param user 
   */
  getDifferentDaysWithTripsOfUser(user) {
    var daysWithTripsOfUser = this.overallStatistics.differentDaysOfTripsPerUser[user.userid];
    if (daysWithTripsOfUser !== undefined){
      return daysWithTripsOfUser.length;
    } else {
      return 0;
    }
  }

  /**
   * Get num of trips of user
   * 
   * @param user 
   */
  getNumOfTripsOfUser(user) {
    var numTripsOfUser = this.overallStatistics.numTripsPerUser[user.userid];
    if (numTripsOfUser !== undefined){
      return numTripsOfUser;
    } else {
      return 0;
    }
  }

  /**
   * Get user register date
   * 
   * @param registerTimestamp 
   * @param returnTimestamp 
   */
  getUserRegisterDate(registerTimestamp, returnTimestamp=false) {
    if (registerTimestamp !== undefined){
      if (returnTimestamp) {
        return registerTimestamp;
      } else {
        return moment(registerTimestamp).format("DD MMM YYYY");;
      }
    } else {
      return "-";
    }
  }

  /**
   * Get date of last trip of user
   * 
   * @param user 
   * @param returnTimestamp 
   */
  getDateOfLastTripOfUser(user, returnTimestamp=false) {
    var lastTripDateOfUser = this.overallStatistics.lastTripOfUser[user.userid];
    if (lastTripDateOfUser !== undefined){
      if (returnTimestamp) {
        return lastTripDateOfUser;
      } else {
        return moment(lastTripDateOfUser).format("DD MMM YYYY");;
      }
    } else {
      return "-";
    }
  }

  /**
   * Get age group statistics
   * 
   * @param ageGroup 
   * @param statisticsObj 
   */
  getAgeGroupStatistics(ageGroup, statisticsObj){
    if (statisticsObj["numUsers"] !== 0){
      return ((ageGroup.count/statisticsObj["numUsers"]) * 100).toFixed(2) + "%";
    } else {
      return "-";
    }
   }

  /**
   * Get degree group statistics
   * 
   * @param degreeGroup 
   * @param statisticsObj 
   */
  getDegreeGroupStatistics(degreeGroup, statisticsObj){
    if (statisticsObj["numUsers"] !== 0) {
      return ((degreeGroup.count/statisticsObj["numUsers"]) * 100).toFixed(2) + "%";
    } else {
      return "-";
    }
  }

  /**
   * Get number of answered surveys
   * 
   * @param user 
   */
  getNumberOfAnsweredSurveys(user) {
    var numAnswrsOfUser = this.numAnsweredSurveysPerUser[user.userid];
    if (numAnswrsOfUser !== undefined){
      return numAnswrsOfUser;
    } else {
      return 0;
    }
  }

  /**
   * Add new user to campaign
   */
  addNewUserToCampaign(){
    this.emailError = undefined;
    if (this.emailOfUserToAdd.hasError('email') || this.emailOfUserToAdd.hasError('required')){
      this.emailOfUserToAdd.setErrors({'email': true});
      return;
    }
     this.campaignService.addNewUserToCampaign(this.emailOfUserToAdd.value, this.currentCampaign.campaignId).then( (updatedUserAndCampaign) => {
      var updatedUser = updatedUserAndCampaign["updatedUser"];
      var updatedCampaign = updatedUserAndCampaign["updatedCampaign"];
     this.currentCampaign = updatedCampaign;
      this.usersInCampaign = this.usersInCampaign.concat([updatedUser]);  // concat instead of push to refresh the table contents      
      
      this.campaignService.getCampaignsStatisticsByID(-1, -1, this.currentCampaign.campaignId).then( (campaignStatistics) => {
      this.overallStatistics = this.calculateStatistics(campaignStatistics);
      });
      
    }).catch( (reasonOfError) => {
      this.emailError = reasonOfError;
      this.emailOfUserToAdd.setErrors({'incorrect': true});
    });
  }

  /**
   * Exclude user from campaign
   */
  excludeUserFromCampaign() {
    this.emailExcludeUserError = undefined;
    if (this.emailOfUserToExclude.hasError('email') || this.emailOfUserToExclude.hasError('required')){
      this.emailOfUserToExclude.setErrors({'email': true});
      return;
    }

    this.campaignService.excludeUserFromCampaign(this.emailOfUserToExclude.value, this.currentCampaign.campaignId).then( (updatedCampaign) => {
      
      this.currentCampaign = updatedCampaign["updatedCampaign"];
      var copyUsers = this.usersInCampaign.slice();             // in order to update mat-table, the data source variable must be reinitialized with new object
      copyUsers = copyUsers.filter(user => {
        return user.email !== this.emailOfUserToExclude.value;
      });
      this.usersInCampaign = copyUsers; 
      
      this.campaignService.getCampaignsStatisticsByID(-1, -1, this.currentCampaign.campaignId).then( (campaignStatistics) => {
      this.overallStatistics = this.calculateStatistics(campaignStatistics);
      });
      
    }).catch( (reasonOfError) => {
      this.emailExcludeUserError = reasonOfError;
      this.emailOfUserToExclude.setErrors({'incorrect': true});
    });
  }

  /**
   * Add multiple users to campaign
   */
  addMultipleUsersToCampaign(){

    var chackEmailFormat = function(email2check){
      var regExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regExp.test(email2check);
    };

    this.emailManyError = undefined;
    this.emailManyResultStatus = undefined;
    var listOfEmailsWithoutWhitespaces = this.listOfEmails.value.replace(/\s/g, "");

    var emailsToAdd = listOfEmailsWithoutWhitespaces.split(',');

    var listOfValidEmails = [];
    var listOfInvalidEmails = [];
    emailsToAdd.forEach(email => {
      if (chackEmailFormat(email)){
        listOfValidEmails.push(email);
      } else {
        listOfInvalidEmails.push(email);
      }
    });
    if (listOfInvalidEmails.length > 0){
      this.emailManyError = "Some emails have wrong format: " + listOfInvalidEmails;
      this.listOfEmails.setErrors({'incorrect': true});
      return;
    } else {
      this.campaignService.addMultipleUsersToCampaign(listOfValidEmails, this.currentCampaign.campaignId).then( (resultOfUpdate) => {
        var updatedUsers = resultOfUpdate["updatedUsers"];
        var unregisteredUsers = resultOfUpdate["unregisteredUsers"];
        var alreadyInCampaign = resultOfUpdate["alreadyInCampaign"];
        var updatedCampaign = resultOfUpdate["updatedCampaign"];
        
        if (updatedCampaign !== null){  // is null when campaign is not updated
          this.currentCampaign = updatedCampaign;
          this.campaignService.getCampaignsStatisticsByID(-1, -1, this.currentCampaign.campaignId).then( (campaignStatistics) => {
          this.overallStatistics = this.calculateStatistics(campaignStatistics);
          });
        }
        updatedUsers.forEach(element => {
          this.usersInCampaign = this.usersInCampaign.concat([element]);  // concat instead of push to refresh the table contents
        });

        this.emailManyResultStatus = 'Unregistered users = ' + unregisteredUsers.length + "\n Users already in campaign = " + alreadyInCampaign.length + "\n Added users = " + updatedUsers.length;

      });
    }

  }

  /**
   * Export global statistics
   */
  exportGlobalStatistics(){
    var getDegreeByDegreeName = function(statisticsDegree, degreeName) {
      var resultingCount = 0;
      statisticsDegree.forEach(element => {
        if (element.name === degreeName){
          resultingCount = element.count;
        }
      });
      return resultingCount;
    };
    var content = "Country,Campaign name,Active users,Nr Users with 14+ days with trips,Submitted trips,Gender-male,Gender-female,Gender-other,Gender-unkonown,\
    Age-16-19,Age-20-24,Age-25-29,Age-30-39,Age-40-49,Age-50-64,Age-65-74,Age-75+,Age-old-intervals,Age-unknown,\
    Education-Basic,Education-high-school,Education-university,Education-unknown\n";
    
    content += this.utilsService.getCountryNameByCountryIso(this.currentCampaign.country) + ",";
    content += this.currentCampaign.name + ",";
    content += this.overallStatistics["numUsers"] + ",";
    content += this.overallStatistics["numUsersWithFourteenDaysWithTrips"] + ",";
    content += this.overallStatistics["numTrips"] + ",";

    content += this.overallStatistics["gender"]["Male"] + ",";
    content += this.overallStatistics["gender"]["Female"] + ",";
    content += this.overallStatistics["gender"]["Other"] + ",";
    content += this.overallStatistics["gender"]["undefined"] + ",";

    // Age:
    this.overallStatistics['age'].forEach(element => {
      content += element.count + ",";
    });

    // Degree:
    // "Basic (up to 10th grade)"
    // "High school (12th grade)"
    // "University"
    // "Unknown"
    content += getDegreeByDegreeName(this.overallStatistics['degree'], "Basic (up to 10th grade)") + ",";
    content += getDegreeByDegreeName(this.overallStatistics['degree'], "High school (12th grade)") + ",";
    content += getDegreeByDegreeName(this.overallStatistics['degree'], "University") + ",";
    content += getDegreeByDegreeName(this.overallStatistics['degree'], "Unknown") + "\n";

    // download file :
    var filename = "Global statistics for " + this.currentCampaign.name;
    const link = document.createElement('a');
    document.body.appendChild(link);
    var blob;
    var csv = content;
    blob = new Blob([csv], { type: 'text/csv;charset=utf-8;base64' });
    link.download = filename + ".csv";
    
    var url = window.URL.createObjectURL(blob);
    link.href = url;
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  /**
   * Export users in campaign statistics
   */
  exportUsersInCampaignStatistics() {
    var content = "Email,registerTimestamp,Name,Points,Number of answers to surveys,Number of trips,Days with trips,Timestamp of last trip\n";
    this.usersInCampaign.forEach(user => {
      content += user.email + "," + this.getUserRegisterDate(user.registerTimestamp,true) + ","+ this.getNameOfUser(user) + "," + this.getPointsOfUser(user) + "," + this.getNumberOfAnsweredSurveys(user) + "," + this.getNumOfTripsOfUser(user) + "," + this.getDifferentDaysWithTripsOfUser(user) + "," + this.getDateOfLastTripOfUser(user, true) + "\n";
    });

    // download file :
    var filename = "Users of campaign " + this.currentCampaign.name;
    const link = document.createElement('a');
    document.body.appendChild(link);
    var blob;
    var csv = content;
    blob = new Blob([csv], { type: 'text/csv;charset=utf-8;base64' });
    link.download = filename + ".csv";
    
    var url = window.URL.createObjectURL(blob);
    link.href = url;
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  /**
   * Get users emails
   */
  getUsersEmails(): void {
    if(!this.usersEmailsBoolean){
      this.usersEmailsBoolean=true;
    }
    else{
      this.usersEmailsBoolean=false;
    }
    var content = "";
    for(var i = 0,size = this.usersInCampaign.length; i<size;i++){
      if(i+1==size){
        content+="<"+this.usersInCampaign[i]["email"]+">";
        break;
      }
      content+="<"+this.usersInCampaign[i]["email"]+">,";
    }
    this.usersEmails = content;
  }
}
