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
import {CampaignService} from "../../providers/campaign.service";
import {UtilsService} from "../../providers/utils.service";
import { AuthService} from '../../providers/auth.service';

import * as moment from 'moment';

@Component({
  selector: 'app-trips-summary',
  templateUrl: './trips-summary.component.html',
  styleUrls: ['./trips-summary.component.css']
})
export class TripsSummaryComponent implements OnInit {

  columnsToShowTrips = ["tripid", "userEmail", "startDate", "validationDate" ,"model", "appVersion", "totalNumLegs", "numCorrectLegs", "totalDistance", "totalTrueDistance", "numMergesSplitsDeletes", "actionsColumn"];
  listOfTrips = undefined;
  listOfTripsOriginModes = undefined;

  firstDay = undefined;
  lastDay = undefined;

  totalNumOfLegs : number;
  detectedNumberLegs;
  correctedLikeDetectedNumberLegs;

  correctedNumberLegs;
  detectedLikeCorrectedNumberLegs;

  detectedDistanceLegs;
  detectedTrueDistanceLegs;
  correctedDistanceLegs;
  correctedTrueDistanceLegs; 

  totalNumOfMerges : number = 0;
  totalNumOfSplits : number = 0;
  totalNumOfDeletes : number = 0;

  confusionMatrixLegs;
  confusionMatrixLegsInverse;

  constructor(
    private campaignService: CampaignService,
    private utilsService: UtilsService,
    private authService: AuthService    // used in html
  ) { }

  ngOnInit() {
    var currDate = moment().utc();
    this.updateTripsBySelectedWeek(currDate);
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Update trips by selected week
   * 
   * @param selectedDate 
   */
  updateTripsBySelectedWeek(selectedDate) {
    this.listOfTrips = undefined;
    this.listOfTripsOriginModes = undefined;
    var firstAndLastDay = this.utilsService.getWeekLimitsByWeekDay(selectedDate);

    this.firstDay = firstAndLastDay["firstDay"];
    this.lastDay = firstAndLastDay["lastDay"];

    var firstDayTs = firstAndLastDay["firstDay"].valueOf();
    var lastDayTs = firstAndLastDay["lastDay"].valueOf();

    this.updateTripsList(firstDayTs, lastDayTs);
  }

  /**
   * Update trips by selected month
   */
  updateTripsBySelectedMonth(selectedDate) {
    this.listOfTrips = undefined;
    this.listOfTripsOriginModes = undefined;

    this.firstDay = selectedDate.clone().startOf("month");
    this.lastDay = selectedDate.clone().endOf("month");

    var firstDayMonthTs = selectedDate.clone().startOf("month").valueOf();
    var lastDayMonthTs = selectedDate.clone().endOf("month").valueOf();

    this.updateTripsList(firstDayMonthTs, lastDayMonthTs);
  }
  
  /**
   * Update trips list
   * 
   * @param firstDayTs 
   * @param lastDayTs 
   */
  updateTripsList(firstDayTs, lastDayTs){
    this.campaignService.getTripStatistics(firstDayTs, lastDayTs).then((trips) => {
      this.listOfTrips = trips;
      this.listOfTripsOriginModes = JSON.parse(JSON.stringify(trips));

      this.totalNumOfMerges = 0;
      this.totalNumOfSplits = 0;
      this.totalNumOfDeletes = 0;

      this.listOfTrips.forEach(trip => {    // redefine the distance of trip as sum of distances of its legs (trips' distance can be wrong)
        var distanceSum = 0;
        trip.legsDistances.forEach(dist => {
          distanceSum += dist;
        });
        trip.totalDistance = distanceSum;

        if (trip.numMerges !== null && trip.numMerges !== -1){
          this.totalNumOfMerges += trip.numMerges;
          this.totalNumOfSplits += trip.numSplits;
          this.totalNumOfDeletes += trip.numDeletes;
        }
      });

      for (var i=0; i<this.listOfTrips.length; i++){
        this.listOfTrips[i] = this.correctModesOfTrip(this.listOfTrips[i]); // apply transport modes equivalence
        this.listOfTrips[i] = this.removeOutliersDistances(this.listOfTrips[i]);  // removes outlier distances
      }

      // console.log("Updated trips: ", this.listOfTrips);
      this.updateOverallStatistics();
      this.updateConfusionMatrix();
    });
  }

  /**
   * Remove outliers distances
   * 
   * @param trip 
   */
  removeOutliersDistances(trip) {

    var walkingFilter = 10000;  // walking, 10 km
    var bicycleFilter = 50000;  // bicycle, 50 km
    var carFilter = 300000;     // Car, 300 km
    var busFilter = 300000;     // Bus, 300 km
    var trainFilter = 500000;   // Train, 500 km

    for(var i = 0; i<trip.correctedModes.length; i++){
      // correctedModes reduce:

      if (trip.correctedModes[i] === 7 && trip.detectedModes[i] !== 7 && trip.legsDistances[i] > walkingFilter) {     
        console.log("TEST: Walking corrected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      else if (trip.correctedModes[i] === 1 && trip.detectedModes[i] !== 1 && trip.legsDistances[i] > bicycleFilter) {
        console.log("TEST: Bicycle corrected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      else if (trip.correctedModes[i] === 9 && trip.detectedModes[i] !== 9 && trip.legsDistances[i] > carFilter) {   
        console.log("TEST: Car corrected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      else if (trip.correctedModes[i] === 15 && trip.detectedModes[i] !== 15 && trip.legsDistances[i] > busFilter) {
        console.log("TEST: Bus corrected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      else if (trip.correctedModes[i] === 10 && trip.detectedModes[i] !== 10 && trip.legsDistances[i] > trainFilter) {   
        console.log("TEST: Train corrected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      // detectedModes reduce:

      if (trip.detectedModes[i] === 7 && trip.correctedModes[i] !== 7 && trip.legsDistances[i] > walkingFilter) {
        console.log("TEST: Walking detected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      else if (trip.detectedModes[i] === 1 && trip.correctedModes[i] !== 1 && trip.legsDistances[i] > bicycleFilter) {
        console.log("TEST: Bicycle detected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      else if (trip.detectedModes[i] === 9 && trip.correctedModes[i] !== 9 && trip.legsDistances[i] > carFilter) {
        console.log("TEST: Car detected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      else if (trip.detectedModes[i] === 15 && trip.correctedModes[i] !== 15 && trip.legsDistances[i] > busFilter) {
        console.log("TEST: Bus detected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

      else if (trip.detectedModes[i] === 10 && trip.correctedModes[i] !== 10 && trip.legsDistances[i] > trainFilter) {
        console.log("TEST: Train detected reduce!");
        trip.legsDistances[i] = 0;
        trip.legsTrueDistances[i] = 0;
      }

    }
    return trip;
  }

  /**
   * Correct modes of trip
   * 
   * @param trip 
   */
  correctModesOfTrip(trip) {
    var sameModeList = [1, 4, 7, 9, 10, 13, 14, 15];
    var toBikeList = [16, 17, 18, 20, 21, 34, 35, 37];
    var toWalkList = [2, 8, 19];
    var toTrainList = [3, 11, 12, 28, 33];
    var toUnknownList = [5, 6, 29, 30, 31, 32];
    var toCarList = [22, 23, 24, 25, 26, 36];
    var toBusList = [27];

    for(var i = 0; i<trip.correctedModes.length; i++){
      var currMode = trip.correctedModes[i];
      if (sameModeList.includes(currMode)){
        continue;
      }
      else if (toBikeList.includes(currMode)){
        trip.correctedModes[i] = 1;
        trip.legsTrueDistances[i] = trip.legsDistances[i];
        continue;
      }
      else if (toWalkList.includes(currMode)){
        trip.correctedModes[i] = 7;
        trip.legsTrueDistances[i] = trip.legsDistances[i];
        continue;
      }
      else if (toTrainList.includes(currMode)){
        trip.correctedModes[i] = 10;
        trip.legsTrueDistances[i] = trip.legsDistances[i];
        continue;
      }
      else if (toUnknownList.includes(currMode)){
        trip.correctedModes[i] = 4;
        trip.legsTrueDistances[i] = trip.legsTrueDistances[i];
        continue;
      }
      else if (toCarList.includes(currMode)){
        trip.correctedModes[i] = 9;
        trip.legsTrueDistances[i] = trip.legsDistances[i];
        continue;
      }
      else if (toBusList.includes(currMode)){
        trip.correctedModes[i] = 15;
        trip.legsTrueDistances[i] = trip.legsDistances[i];
        continue;
      }
    }
    return trip;
  }

  /**
   * Update overall statistics
   */
  updateOverallStatistics() {
    this.totalNumOfLegs = 0;
    this.detectedNumberLegs = {"Walking": 0, "Bicycle": 0, "Car": 0, "Bus": 0, "Train": 0};
    this.correctedLikeDetectedNumberLegs = {"Walking": 0, "Bicycle": 0, "Car": 0, "Bus": 0, "Train": 0};
    this.correctedNumberLegs = {"Walking": 0, "Bicycle": 0, "Car": 0, "Bus": 0, "Train": 0};
    this.detectedLikeCorrectedNumberLegs = {"Walking": 0, "Bicycle": 0, "Car": 0, "Bus": 0, "Train": 0};

    this.detectedDistanceLegs = {"Walking": 0, "Bicycle": 0, "Car": 0, "Bus": 0, "Train": 0};
    this.detectedTrueDistanceLegs = {"Walking": 0, "Bicycle": 0, "Car": 0, "Bus": 0, "Train": 0};
    this.correctedDistanceLegs = {"Walking": 0, "Bicycle": 0, "Car": 0, "Bus": 0, "Train": 0};
    this.correctedTrueDistanceLegs = {"Walking": 0, "Bicycle": 0, "Car": 0, "Bus": 0, "Train": 0};
    
    this.listOfTrips.forEach(element => {
      this.totalNumOfLegs += element.detectedModes.length;

      // Rate A:
      for(var i = 0; i<element.detectedModes.length; i++){
        if (element.detectedModes[i] === 7){
          this.detectedNumberLegs["Walking"] +=1;
          if (element.correctedModes[i] === 7){
            this.correctedLikeDetectedNumberLegs["Walking"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.detectedDistanceLegs["Walking"] += element.legsDistances[i];
            this.detectedTrueDistanceLegs["Walking"] += element.legsTrueDistances[i];
          }

        } else if (element.detectedModes[i] === 1){
          this.detectedNumberLegs["Bicycle"] +=1;
          if (element.correctedModes[i] === 1){
            this.correctedLikeDetectedNumberLegs["Bicycle"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.detectedDistanceLegs["Bicycle"] += element.legsDistances[i];
            this.detectedTrueDistanceLegs["Bicycle"] += element.legsTrueDistances[i];
          }

        } else if (element.detectedModes[i] === 9){
          this.detectedNumberLegs["Car"] +=1;
          if (element.correctedModes[i] === 9){
            this.correctedLikeDetectedNumberLegs["Car"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.detectedDistanceLegs["Car"] += element.legsDistances[i];
            this.detectedTrueDistanceLegs["Car"] += element.legsTrueDistances[i];
          }

        } else if (element.detectedModes[i] === 15){
          this.detectedNumberLegs["Bus"] +=1;
          if (element.correctedModes[i] === 15){
            this.correctedLikeDetectedNumberLegs["Bus"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.detectedDistanceLegs["Bus"] += element.legsDistances[i];
            this.detectedTrueDistanceLegs["Bus"] += element.legsTrueDistances[i];
          }

        } else if (element.detectedModes[i] === 10){
          this.detectedNumberLegs["Train"] +=1;
          if (element.correctedModes[i] === 10){
            this.correctedLikeDetectedNumberLegs["Train"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.detectedDistanceLegs["Train"] += element.legsDistances[i];
            this.detectedTrueDistanceLegs["Train"] += element.legsTrueDistances[i];
          }
        }

        // Rate B:
        if (element.correctedModes[i] === 7){
          this.correctedNumberLegs["Walking"] +=1;
          if (element.detectedModes[i] === 7){
            this.detectedLikeCorrectedNumberLegs["Walking"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.correctedDistanceLegs["Walking"] += element.legsDistances[i];
            this.correctedTrueDistanceLegs["Walking"] += element.legsTrueDistances[i];
          }

        } else if (element.correctedModes[i] === 1){
          this.correctedNumberLegs["Bicycle"] +=1;
          if (element.detectedModes[i] === 1){
            this.detectedLikeCorrectedNumberLegs["Bicycle"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.correctedDistanceLegs["Bicycle"] += element.legsDistances[i];
            this.correctedTrueDistanceLegs["Bicycle"] += element.legsTrueDistances[i];
          }

        } else if (element.correctedModes[i] === 9){
          this.correctedNumberLegs["Car"] +=1;
          if (element.detectedModes[i] === 9){
            this.detectedLikeCorrectedNumberLegs["Car"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.correctedDistanceLegs["Car"] += element.legsDistances[i];
            this.correctedTrueDistanceLegs["Car"] += element.legsTrueDistances[i];
          }

        } else if (element.correctedModes[i] === 15){
          this.correctedNumberLegs["Bus"] +=1;
          if (element.detectedModes[i] === 15){
            this.detectedLikeCorrectedNumberLegs["Bus"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.correctedDistanceLegs["Bus"] += element.legsDistances[i];
            this.correctedTrueDistanceLegs["Bus"] += element.legsTrueDistances[i];
          }

        } else if (element.correctedModes[i] === 10){
          this.correctedNumberLegs["Train"] +=1;
          if (element.detectedModes[i] === 10){
            this.detectedLikeCorrectedNumberLegs["Train"] +=1;
          }
          // dist:
          if (element.legsTrueDistances[i] !== -1 && element.legsTrueDistances[i] <= element.legsDistances[i]){ // trueDistance is defined for this leg, otherwise discard
            this.correctedDistanceLegs["Train"] += element.legsDistances[i];
            this.correctedTrueDistanceLegs["Train"] += element.legsTrueDistances[i];
          }
        }
      }

    });
  }

  /**
   * Update confusion matrix
   */
  updateConfusionMatrix() {
    this.confusionMatrixLegs = {
      7 : {7:0, 1:0, 9:0, 15:0, 10:0},
      1 : {7:0, 1:0, 9:0, 15:0, 10:0},
      9 : {7:0, 1:0, 9:0, 15:0, 10:0},
      15 : {7:0, 1:0, 9:0, 15:0, 10:0},
      10 : {7:0, 1:0, 9:0, 15:0, 10:0}
    };

    this.confusionMatrixLegsInverse = {
      7 : {7:0, 1:0, 9:0, 15:0, 10:0},
      1 : {7:0, 1:0, 9:0, 15:0, 10:0},
      9 : {7:0, 1:0, 9:0, 15:0, 10:0},
      15 : {7:0, 1:0, 9:0, 15:0, 10:0},
      10 : {7:0, 1:0, 9:0, 15:0, 10:0}
    };

    // console.log("Test, list of trips: ", this.listOfTrips);
    var detectableModes = [7, 1, 9, 15, 10];
    this.listOfTrips.forEach(element => {
      for(var i = 0; i<element.detectedModes.length; i++){
        var detected = element.detectedModes[i];
        var corrected = element.correctedModes[i];
        if (detectableModes.includes(detected) && detectableModes.includes(corrected)){
          this.confusionMatrixLegs[detected][corrected] += 1;
          this.confusionMatrixLegsInverse[corrected][detected] += 1;
        }
      }
    });
  }

  /**
   * Get confusion matrix entry
   * 
   * @param detectedModeName 
   * @param correctedModeName 
   * @param inverse 
   */
  getConfusionMatrixEntry(detectedModeName, correctedModeName, inverse: boolean){
    var detectableModesWithNames = {"Walking": 7, "Bicycle": 1, "Car": 9, "Bus": 15, "Train": 10};
    var detectedMode = detectableModesWithNames[detectedModeName];
    var correctedMode = detectableModesWithNames[correctedModeName];
    var percentage;

    if (inverse) {
      var numberCorrections = this.confusionMatrixLegsInverse[correctedMode][detectedMode];
      var totalNumCorr = this.correctedNumberLegs[correctedModeName];
      if (totalNumCorr < 1) {
        percentage = 0.0;
      } else {
        percentage = ((numberCorrections / totalNumCorr) * 100).toFixed(2);
      }
      return numberCorrections + " (" + percentage + "%)";
    } else {
      var numberCorrectDetections = this.confusionMatrixLegs[detectedMode][correctedMode];
      var totalNumDetections = this.detectedNumberLegs[detectedModeName];
      if (totalNumDetections < 1) {
        percentage = 0.0;
      } else {
        percentage = ((numberCorrectDetections / totalNumDetections) * 100 ).toFixed(2);
      }
      return numberCorrectDetections + " (" + percentage + "%)";
    }
  }

  /**
   * Get success rate for mode
   * 
   * @param firstRate 
   * @param mode 
   */
  getSucessRateForMode(firstRate: boolean, mode: string){
    if (firstRate){ // rate A
      if (this.detectedNumberLegs[mode] === 0){
        return "-";
      } else {
        return ((this.correctedLikeDetectedNumberLegs[mode] / this.detectedNumberLegs[mode]) * 100).toFixed(2);
      }
    } else {  // rate B
      if (this.correctedNumberLegs[mode] === 0){
        return "-";
      } else {
        return ((this.detectedLikeCorrectedNumberLegs[mode] / this.correctedNumberLegs[mode]) * 100).toFixed(2);
      }
    }
  }

  /**
   * Get sucess rate dist for mode
   * 
   * @param firstRate 
   * @param mode 
   */
  getSucessRateDistForMode(firstRate : boolean, mode: string) {
    if (firstRate){   // rate A
      if (this.detectedDistanceLegs[mode] === 0){
        return "-";
      } else {
        return ((this.detectedTrueDistanceLegs[mode] / this.detectedDistanceLegs[mode]) * 100).toFixed(2);
      }
    } else {    // rate B
      if (this.correctedDistanceLegs[mode] === 0){
        return "-";
      } else {
        return ((this.correctedTrueDistanceLegs[mode] / this.correctedDistanceLegs[mode]) * 100).toFixed(2);
      }
    }
  }

  /**
   * Get num of merges splits deletes
   * 
   * @param trip 
   */
  getNumOfMergesSplitsDeletes(trip){
    if (trip.numMerges === null || trip.numMerges === -1){
      return "-/-/-";
    }
    return trip.numMerges + "/" + trip.numSplits + "/" + trip.numDeletes;
  }

  /**
   * Get readable time
   * 
   * @param timestamp 
   */
  getReadableTime(timestamp) {
    return this.utilsService.getReadableTime(timestamp);
  }

  /**
   * Get percentage of correct legs
   * 
   * @param trip 
   */
  getPercentageOfCorrectLegs(trip){
    return ((trip.numCorrectLegs / trip.totalNumLegs) * 100).toFixed(2);
  }

  /**
   * Get total distance
   * 
   * @param trip 
   */
  getTotalDistance(trip){
    return (trip.totalDistance/1000.0).toFixed(2);
  }

  /**
   * Get true distance
   * 
   * @param trip
   */
  getTrueDistance(trip){
    if (trip.totalTrueDistance === -1){
      return "-";
    }
    return (trip.totalTrueDistance/1000.0).toFixed(2);
  }

  /**
   * Get percentage of true distance
   * 
   * @param trip 
   */
  getPercentageOfTrueDistance(trip){
    if (trip.totalTrueDistance === -1){
      return ""
    }
    return "(" + ((trip.totalTrueDistance / trip.totalDistance) * 100).toFixed(2) + "%)";
  }
}
