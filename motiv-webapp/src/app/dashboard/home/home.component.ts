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
import {ServerCommunicationService} from '../../providers/server-communication.service';
import { CampaignService } from 'src/app/providers/campaign.service';
import {AuthService} from '../../providers/auth.service';
import {UtilsService} from "../../providers/utils.service";

import * as moment from 'moment';
import { SurveyConnectionsService } from 'src/app/providers/survey-connections.service';

@Component({
  selector: 'app-home',
  templateUrl: `./home.component.html`,
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {

  response;
  tripId: string;
  rawDataPartNumber: string;
  warningMessage: string;

  token;

  firstDaySpecificFilterWeek;
  lastDaySpecificFilterWeek;
  firstDaySpecificFilterMonth;
  lastDaySpecificFilterMonth;
  specificNumUsersWeek : number = undefined;
  specificNumTripsWeek : number = undefined;
  specificNumUsersMonth : number = undefined;
  specificNumTripsMonth : number = undefined;

  currWeekNumTrips: number;
  currWeekNumUsers: number;
  currMonthNumTrips: number;
  currMonthNumUsers: number;
  overallNumTrips: number;
  overallNumUsers: number;
  overallNumTripsWithoutDuplicates: number;

  usersUpdatedByTargetCampaign = undefined;

  tripDigests = undefined;

  constructor(private tripService: ServerCommunicationService,
              private campaignService : CampaignService,
              private authService: AuthService,
              private utilsService: UtilsService,
              private surveyConnection: SurveyConnectionsService,
              ) { }

  ngOnInit() {
    var currentDate = moment().utc(); 
    
    var firstAndLastWeekDay = this.utilsService.getWeekLimitsByWeekDay(currentDate.clone());
    var firstDayWeekTs = firstAndLastWeekDay["firstDay"].valueOf();
    var lastDayWeekTs = firstAndLastWeekDay["lastDay"].valueOf();
    this.campaignService.getStatisticsUsersTrips(firstDayWeekTs, lastDayWeekTs).then(response => {
        this.currWeekNumTrips = response.trips;
        this.currWeekNumUsers = response.users;
    });

    var firstDayMonthTs = currentDate.clone().startOf("month").valueOf();
    var lastDayMonthTs = currentDate.clone().endOf("month").valueOf();
    this.campaignService.getStatisticsUsersTrips(firstDayMonthTs, lastDayMonthTs).then(response => {
        this.currMonthNumTrips = response.trips;
        this.currMonthNumUsers = response.users;
    });

    this.campaignService.getStatisticsUsersTrips().then(response => { // overall arguments
        this.overallNumTrips = response.trips;
        this.overallNumUsers = response.users;
    }); 
    this.campaignService.getTotalTripsWithoutDuplicates().then(response => { // overall arguments without duplicates
      this.overallNumTripsWithoutDuplicates = response.count;
  }); 
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Update statistics by specific week
   * 
   * @param selectedDate 
   */
  updateStatisticsBySpecificWeek(selectedDate) {
    var firstAndLastDay = this.utilsService.getWeekLimitsByWeekDay(selectedDate);

    this.firstDaySpecificFilterWeek = firstAndLastDay["firstDay"];
    this.lastDaySpecificFilterWeek = firstAndLastDay["lastDay"];

    var firstDayTs = firstAndLastDay["firstDay"].valueOf();
    var lastDayTs = firstAndLastDay["lastDay"].valueOf();

    this.campaignService.getStatisticsUsersTrips(firstDayTs, lastDayTs).then(response => {
      this.specificNumTripsWeek = response.trips;
      this.specificNumUsersWeek = response.users;
    });
  }

  /**
   * Update statistics by specific month
   * 
   * @param selectedDate 
   */
  updateStatisticsBySpecificMonth(selectedDate) {
    
    this.firstDaySpecificFilterMonth = selectedDate.clone().startOf("month");
    this.lastDaySpecificFilterMonth = selectedDate.clone().endOf("month");

    var firstDayMonthTs = selectedDate.clone().startOf("month").valueOf();
    var lastDayMonthTs = selectedDate.clone().endOf("month").valueOf();

    this.campaignService.getStatisticsUsersTrips(firstDayMonthTs, lastDayMonthTs).then(response => {
        this.specificNumTripsMonth = response.trips;
        this.specificNumUsersMonth = response.users;
    });
  }

  /**
   * Get csv
   */
  getCsv(): void {
    this.response = null;
    this.tripService.getCsv().subscribe(response => {
      this.response = response.status;

      if (response.status === 200) {
        const link = document.createElement('a');
        link.download = 'legsInfo.csv';
        const blob = new Blob([response.body], { type: 'text/csv;charset=utf-8;base64' });
        link.href = window.URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
      } else {
        this.response = response.body;
      }

    });
  }

  /**
   * Get token
   */
  getToken(): void {
    this.token = null;
    this.authService.getToken().then( (token) => {
      console.log('Received token = ' + token);
      this.token = token;
    });
  }

  /**
   * Export information about all trips (not validated + validated)
   */
  exportTripDigests(){
    this.campaignService.getTripDigests().then((tripDigests) => {
      this.tripDigests = tripDigests;
      var content = "userid,startDate (ms),totalDistance (m),totalTime (ms)\n";
      for(var i=0; i<this.tripDigests.length; i++){
        content+=this.tripDigests[i].userid+","+this.tripDigests[i].startDate+","+this.tripDigests[i].totalDistance+","+this.tripDigests[i].totalTime+"\n";
      }
      //summaries = digests
      var filename = "Trips Summaries";
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
    });
  }

  /**
   * Updates users surveys
   */
  updateUsersInSurveyByTargetCampaign(){
    this.usersUpdatedByTargetCampaign = undefined;
    this.surveyConnection.updateUserListInSurveysByTargetCampaigns().then( res => {
      this.usersUpdatedByTargetCampaign = true;
    });
  }

  /**
   * Get points
   */
  getPoints(): void {
    const regExpr = /^#[0-9]+:[0-9]+$/;
    if (!regExpr.test(this.tripId)) {
      this.warningMessage = 'Warning: Invalid format of TripId (example of valid form: #1:2)';
      console.log("Error = " + this.warningMessage);
      return;
    }

    const tripIdToSendComps = this.tripId.split(':');
    const tripIdToSend = tripIdToSendComps[0].substr(1) + '-' + tripIdToSendComps[1];

    this.tripService.getPointsCsv(tripIdToSend).subscribe(response => {
      if (response.status === 200) {
        const link = document.createElement('a');
        link.download = 'points_' + tripIdToSend + '.csv';
        const blob = new Blob([response.body], { type: 'text/csv;charset=utf-8;base64' });
        link.href = window.URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
      } else {
        this.warningMessage = response.error;
      }
    });
  }

  /**
   * Get raw data
   */
  getRawData() : void {
    const regExpr = /^[0-9]+$/;
    if (!regExpr.test(this.rawDataPartNumber)) {
      this.warningMessage = 'Invalid raw data part number';
      console.log("Error = " + this.warningMessage);
      return;
    }

    this.response = null;
    this.tripService.getRawData(this.rawDataPartNumber).subscribe(response => {
      this.response = response.status;
      if (response.status === 200){
          var link = document.createElement("a");
          link.download = "legsRawData_" + this.rawDataPartNumber +".csv";
          var blob = new Blob([response.body], { type: 'text/csv;charset=utf-8;base64' });
          link.href = window.URL.createObjectURL(blob);;
          document.body.appendChild(link);
          link.click();
      } else {
        this.response = response.body;
      }    
    });
  }
}