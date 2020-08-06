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
import {CampaignService} from "../../../providers/campaign.service";
import { UtilsService } from 'src/app/providers/utils.service';

@Component({
  selector: 'app-trip-info',
  templateUrl: './trip-info.component.html',
  styleUrls: ['./trip-info.component.css']
})
export class TripInfoComponent implements OnInit {

  currentTripId;
  currentTrip;

  constructor(
    private route: ActivatedRoute,
    private campaignService: CampaignService,
    private utilService : UtilsService
  ) { }

  ngOnInit() {
    this.currentTripId = this.route.snapshot.params['tripid'];

    this.campaignService.getTripInfo(this.currentTripId).then((trip) => {
      this.currentTrip = trip;
    });
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Get readable time
   * 
   * @param timestamp 
   */
  getReadableTime(timestamp) {
    var date = new Date(timestamp);
    return date.toLocaleString('en-GB', { hour12: false });
  }

  /**
   * get Validation date
   * 
   * @param timestamp 
   */
  getValidationDate(timestamp) {
    if (timestamp) {
      return this.getReadableTime(timestamp);
    } else {
      return "-";
    }
  }

  /**
   * Get duration
   * 
   * @param startDateTs 
   * @param endDateTs 
   */
  getDuration(startDateTs, endDateTs){
    var startDate = new Date(startDateTs);
    var endDate = new Date(endDateTs);
    var diffInMilliseconds = endDate.getTime() - startDate.getTime();
    var oneHourInMilliseconds = 3600000; // 1000×60×60
    var diffInHours = diffInMilliseconds/oneHourInMilliseconds;
    var hours = Math.floor(diffInHours);
    var minutes = (diffInHours % 1) * 60;
    var seconds = (minutes % 1) * 60;
    return hours + "h " + Math.round(minutes) + "m " + Math.round(seconds) + "s";
  }

  /**
   * Get merges splits deletes
   * 
   * @param numberToShow
   */
  getMergesSplitsDeletes(numberToShow){
    if (numberToShow === null || numberToShow === -1){
      return "-";
    } else {
      return numberToShow;
    }
  }

  /**
   * Get percentage of correct legs
   */
  getPercentageOfCorrectLegs(){
    return ((this.currentTrip.numCorrectLegs / this.currentTrip.totalNumLegs) * 100).toFixed(2);
  }

  /**
   * Get distance in km
   * 
   * @param distance 
   */
  getDistanceInKm(distance) {
    return (distance / 1000).toFixed(2) + " km";
  }

  /**
   * Get true distance
   * 
   * @param trueDistance 
   * @param totalDistance 
   */
  getTrueDistance(trueDistance, totalDistance){
    if (trueDistance === undefined || trueDistance === -1){
      return "-";
    }
    return (trueDistance/1000.0).toFixed(2) + " km (" + ((trueDistance/totalDistance)*100).toFixed(2) + "%)";
  }

  /**
   * Get optional boolean
   * 
   * @param booleanValue 
   */
  getOptionalBoolean(booleanValue){
    if (booleanValue === undefined){
      return "-";
    }
    return booleanValue;
  }

  /**
   * Transport mode to string
   * 
   * @param mode 
   */
  transportModeToStr(mode){
    return this.utilService.getTransportModeName(mode);
  }
}