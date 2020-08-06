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
import { CampaignService} from '../../providers/campaign.service';
import {Router} from '@angular/router';
import { AuthService} from '../../providers/auth.service';
import { UtilsService } from 'src/app/providers/utils.service';

@Component({
  selector: 'app-campaign',
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.css']
})

//Component responsible for managing the multiple campaigns
export class CampaignComponent implements OnInit {

  columnsToShowCampaign;
  selectedCampaignToExport : any = "All";
  selectedFormat = "JSON";

  constructor(
    private campaignService: CampaignService,
    private router: Router,
    private authService: AuthService,    // used in html
    private utilService: UtilsService
  ) { }

  ngOnInit() {
    this.columnsToShowCampaign = ['campaignId', 'campaignName', 'campaignCountryCity', 'publicPrivate', 'actionsColumn'];
    this.campaignService.getMotivManagedCampaignsFromServer();
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Get managed campaigns
   */
  getManagedCampaigns() {
    return this.campaignService.getMotivManagedCampaigns();
  }

  /**
   * Create campaign
   */
  createCampaign() {
    this.router.navigate(['/dashboard/campaign/createCampaign'], {queryParams: {editing: false, campaignId: ""}});
  }

  /**
   * Edit campaign
   * 
   * @param campaignData
   */
  editCampaign(campaignData) {
    this.router.navigate(['/dashboard/campaign/createCampaign'], {queryParams: {editing: true, campaignId: campaignData.campaignId}});
  }

  /**
   * Deactivate campaign
   * 
   * @param row 
   */
  deactivateCampaign(row) {
    row.active = false;
    this.campaignService.editCampaign(row, this.responseHandler.bind(this));
  }

  /**
   * Activate campaign
   * 
   * @param row 
   */
  activateCampaign(row) {
    row.active = true;
    this.campaignService.editCampaign(row, this.responseHandler.bind(this));
  }

  /**
   * Get country name by iso
   * 
   * @param countryIso 
   */
  getCountryNameByIso(countryIso: string){
    return this.utilService.getCountryNameByCountryIso(countryIso);
  }

  /**
   * Response handler
   * 
   * @param resp 
   */
  responseHandler(resp) {
    console.log(resp);

    if (resp.ok) {

      alert('Campaign edited successfully!');
      } else {
      alert('Campaign created successfully!');
    }
  }

  /**
   * is public OR private
   * 
   * @param campaign 
   */
  isPublicPrivate(campaign){
    if (campaign.isPrivate) {
      return "Private";
    } else {
      return "Public";
    }
  }

  /**
   * Process Array
   * 
   * @param arrayToProcess 
   */
  processArray(arrayToProcess): string{
    return JSON.stringify(arrayToProcess).replace(/[,]/g, "| ");  // replace , by |
  }

  /**
   * Process value from trip
   * 
   * @param valueFromTrip 
   */
  processValueFromTrip(valueFromTrip): string{
    if(valueFromTrip.length<4 || valueFromTrip.length===undefined){
      return ",,,"
    }
    return valueFromTrip[0].value+","+valueFromTrip[1].value+","+valueFromTrip[2].value+","+valueFromTrip[3].value
  }

  /**
   * Process Objectives
   * used to build csv - each column one objective (true or false entry)
   * 
   * @param objectives 
   */
  processObjectives(objectives): string{    
    var objectiveCodes = ["Home","Work","School_Education","Everyday_Shopping","Business_Trip","Leisure_Hobby","Pick_Up_Drop_Off","Personal_Tasks_Errands","Trip_Itself","Other"];
    var returnList = []
    var sizeList = objectiveCodes.length
    for(var i=0;i<sizeList;i++){
      returnList.push("")
    }
    objectives.forEach(objective => {
      if(objective.tripObjectiveCode!=objectiveCodes.length-1){
        returnList[objective.tripObjectiveCode]="true"
      }
      if(objective.tripObjectiveCode===objectiveCodes.length-1) {
       returnList[objective.tripObjectiveCode]=this.processArray(objective.tripObjectiveString);
      }
    });

    var returnString = ""
    for(var i=0;i<returnList.length;i++){
      if(i===returnList.length-1){
        returnString+=returnList[i]
        break;
      }
      returnString+=returnList[i]+","
    }
    return returnString
  }

  /**
   * Process factors
   * used to build csv - each column one factor (true or false entry)
   * 
   * @param activitiesFactors 
   * @param comfortAndPleasentFactors 
   * @param whileYouRideFactors 
   * @param gettingThereFactors 
   * @param transportMode 
   */
  processFactors(activitiesFactors,comfortAndPleasentFactors,whileYouRideFactors,gettingThereFactors,transportMode): string {
    var codes = [1001,1101,1102,1103,1104,1105,1106,1107,1108,1109,1110,1201,1202,1203,1204,1205,1206,1207,1208,1209,1210,1211,1301,1302,1303,1304,1305,1306,1307,1308,1309,2102,2103,2104,2107,2109,2110,2111,2112,2113,2202,2203,2206,2207,2210,3102,3103,3202,3203,3206,3211,3212]
    var returnList = []
    var numberOfColumns = codes.length*2
    for(var i=0;i<numberOfColumns;i++){
      returnList.push("")
    }
    activitiesFactors.forEach(factor => {
      if(factor.code===null || factor.code===undefined){
        return;
      }
      for(var i=0;i<codes.length;i++){
        if(codes[i]==factor.code){
          var index=i*2
          returnList[index]=factor.plus
          returnList[index+1]=factor.minus
        }
      }
    });
    comfortAndPleasentFactors.forEach(factor => {
      if(factor.code===null || factor.code===undefined){
        return;
      }
      for(var i=0;i<codes.length;i++){
        if(codes[i]==factor.code){
          var index=i*2
          returnList[index]=factor.plus
          returnList[index+1]=factor.minus
        }
      }
    });
    whileYouRideFactors.forEach(factor => {
      if(factor.code===null || factor.code===undefined){
        return;
      }
      for(var i=0;i<codes.length;i++){
        if(codes[i]==factor.code){
          var index=i*2
          returnList[index]=factor.plus
          returnList[index+1]=factor.minus
        }
      }
    });
    gettingThereFactors.forEach(factor => {
      if(factor.code===null || factor.code===undefined){
        return;
      }
      for(var i=0;i<codes.length;i++){
        if(codes[i]==factor.code){
          var index=i*2
          returnList[index]=factor.plus
          returnList[index+1]=factor.minus
        }
      }
    });
    var returnString = ""
    for(var i=0;i<returnList.length;i++){
      if(i===returnList.length-1){
        returnString+=returnList[i]
        break;
      }
      returnString+=returnList[i]+","
    }
    return returnString
  }

  /**
   * Process generic activities
   * 
   * @param genericActivities 
   */
  processGenericActivities(genericActivities): string{
    var activityList = ["MTActivityReading",
    "MTActivityEatingDrinking",
    "MTActivityExercising",
    "MTActivityPersonalCare",
    "MTActivityDriving",
    "MTActivityRelaxing",
    "MTActivityBrowsing",
    "MTActivityReadingPaper",
    "MTActivityReadingDevice",
    "MTActivityListening",
    "MTActivityWatching",
    "MTActivityTalking",
    "MTActivityAccompanying",
    "MTActivityEating",
    "MTActivityThinking",
    "MTActivitySleepingSnoozing",
    "MTActivityRelaxingDoingNothing",
    "MTActivityTalkingToOthers",
    "MTActivityObserveView",
    "MTActivityListenToAudioMedia",
    "MTActivityVideo",
    "MTActivityTextMessages",
    "MTActivityPhoneCall",
    "MTActivityInternetBrowsing",
    "MTActivitySocialMedia",
    "MTActivityPlayingGames",
    "MTActivityWriting",
    "MTActivityCheckingEmail",
    "MTActivityCaringForSomeone",
    "MTActivityOther"]
    var returnList = ["","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""]
    genericActivities.forEach(activity => {
      for(var i=0;i<activityList.length;i++){
        if(activityList[i]==activity.code){
          returnList[i]="true"
          if(activity.code==="MTActivityOther"){
            returnList[i]=activity.text
          }
        }
      }
      
    });
    var returnString = ""
    for(var i=0;i<returnList.length;i++){
      if(i===returnList.length-1){
        returnString+=returnList[i]
        break;
      }
      returnString+=returnList[i]+","
    }
    return returnString
  }

  /**
   * Get address
   * 
   * @param element 
   */
  getAddress(element): string{
    if(element===undefined){
      return element
    }
    if(element.address!=undefined){
      return element.address
    }
    return undefined
  }

  /**
   * Correct gender
   * 
   * @param currUserSettings 
   */
  correctGender(currUserSettings): number{
    var genders = [{originalGender:"Male",correctGender:"Male"},{originalGender:"Female",correctGender:"Female"},{originalGender:"Other",correctGender:"Other"},{originalGender:"Muško",correctGender:"Male"},{originalGender:"Man",correctGender:"Male"},{originalGender:"Male",correctGender:"Male"},{originalGender:"Mies",correctGender:"Male"},{originalGender:"Homme",correctGender:"Male"},{originalGender:"Männlich",correctGender:"Male"},{originalGender:"Uomo ",correctGender:"Male"},{originalGender:"Mann",correctGender:"Male"},{originalGender:"Masculino",correctGender:"Male"},{originalGender:"Muž",correctGender:"Male"},{originalGender:"Hombre",correctGender:"Male"},{originalGender:"Dona",correctGender:"Female"},{originalGender:"Žensko",correctGender:"Female"},{originalGender:"Vrouw",correctGender:"Female"},{originalGender:"Female",correctGender:"Female"},{originalGender:"Nainen",correctGender:"Female"},{originalGender:"Femme",correctGender:"Female"},{originalGender:"Weiblich",correctGender:"Female"},{originalGender:"Femmina",correctGender:"Female"},{originalGender:"Kvinne",correctGender:"Female"},{originalGender:"Feminino",correctGender:"Female"},{originalGender:"Žena",correctGender:"Female"},{originalGender:"Mujer",correctGender:"Female"},{originalGender:"Altres",correctGender:"Other"},{originalGender:"Drugo",correctGender:"Other"},{originalGender:"Andere",correctGender:"Other"},{originalGender:"Other",correctGender:"Other"},{originalGender:"Muu",correctGender:"Other"},{originalGender:"Autre",correctGender:"Other"},{originalGender:"Andere",correctGender:"Other"}]
    for(var h=0;h<genders.length;h++){
      if(currUserSettings.gender==genders[h].originalGender){
        currUserSettings.gender=genders[h].correctGender;
        return
      }
    }
    return
  }

  /**
   * Build trips csv
   * 
   * @param trips 
   */
  buildTripsCsv(trips) : string{
    var content = "tripid,​​startAddress,finalAddress,tripStartDate,tripEndDate,tripValidationDate,​​​model,​​​oS,​​​oSVersion,​​​cityInfo,​​​countryInfo,​​​duration,​​​distance,​​​manualTripStart,manualTripEnd,averageSpeed,​​​maxSpeed,overallScore,objective:Home,objective:Work,objective:School_Education,objective:Everyday_Shopping,objective:Business_Trip,objective:Leisure_Hobby,objective:Pick_Up_Drop_Off,objective:Personal_Tasks_Errands,objective:Trip_Itself,objective:Other,​​​numMerges,​​​numSplits,​​​numDeletes,shareInformation,​​​usetripMoreFor,​​​didYouHaveToArrive,​​​howOften,legid,class,legStartDate,legEndDate,wastedTime,valueFromTripCode0,valueFromTripCode1,valueFromTripCode2,valueFromTripCode3,genericActivity:MTActivityReading,genericActivity:MTActivityEatingDrinking,genericActivity:MTActivityExercising,genericActivity:MTActivityPersonalCare,genericActivity:MTActivityDriving,genericActivity:MTActivityRelaxing,genericActivity:MTActivityBrowsing,genericActivity:MTActivityReadingPaper,genericActivity:MTActivityReadingDevice,genericActivity:MTActivityListening,genericActivity:MTActivityWatching,genericActivity:MTActivityTalking,genericActivity:MTActivityAccompanying,genericActivity:MTActivityEating,genericActivity:MTActivityThinking,genericActivity:MTActivitySleepingSnoozing,genericActivity:MTActivityRelaxingDoingNothing,genericActivity:MTActivityTalkingToOthers,genericActivity:MTActivityObserveView,genericActivity:MTActivityListenToAudioMedia,genericActivity:MTActivityVideo,genericActivity:MTActivityTextMessages,genericActivity:MTActivityPhoneCall,genericActivity:MTActivityInternetBrowsing,genericActivity:MTActivitySocialMedia,genericActivity:MTActivityPlayingGames,genericActivity:MTActivityWriting,genericActivity:MTActivityCheckingEmail,genericActivity:MTActivityCaringForSomeone,genericActivity:MTActivityOther,1001:Ability_To_Do_What_I_Wanted:plus,1001:Ability_To_Do_What_I_Wanted:minus,1101:Simplicity_Difficulty_Of_The_Route:plus,1101:Simplicity_Difficulty_Of_The_Route:minus,1102:Schedule_Reliability:plus,1102:Schedule_Reliability:minus,1103:Security_And_Safety:plus,1103:Security_And_Safety:minus,1104:Space_Onboard_For_Lugagge_Pram_Bicycle:plus,1104:Space_Onboard_For_Lugagge_Pram_Bicycle:minus,1105:Ability_To_Take_Kids_Or_Pets_Along:plus,1105:Ability_To_Take_Kids_Or_Pets_Along:minus,1106:Payment_And_Tickets:plus,1106:Payment_And_Tickets:minus,1107:Convenient_Access_Lifts_Boarding:plus,1107:Convenient_Access_Lifts_Boarding:minus,1108:Route_Planning_Navigation_Tools:plus,1108:Route_Planning_Navigation_Tools:minus,1109:Information_And_Signs:plus,1109:Information_And_Signs:minus,1110:Checkin_Security_And_Boarding:plus,1110:Checkin_Security_And_Boarding:minus,1201:Todays_Weather:plus,1201:Todays_Weather:minus,1202:Crowdedness_Seating:plus,1202:Crowdedness_Seating:minus,1203:Internet_Connectivity:plus,1203:Internet_Connectivity:minus,1204:Charging_Opportunity:plus,1204:Charging_Opportunity:minus,1205:Tables:plus,1205:Tables:minus,1206:Toilets:plus,1206:Toilets:minus,1207:Food_Drink_Allowed:plus,1207:Food_Drink_Allowed:minus,1208:Food_Drink_Available:plus,1208:Food_Drink_Available:minus,1209:Shopping_Retail:plus,1209:Shopping_Retail:minus,1210:Entertainment:plus,1210:Entertainment:minus,1211:Car_Bike_Parking_At_Transfer_Point:plus,1211:Car_Bike_Parking_At_Transfer_Point:minus,1301:Vehicle_Ride_Smoothness:plus,1301:Vehicle_Ride_Smoothness:minus,1302:Seating_Quality_Personal_Space:plus,1302:Seating_Quality_Personal_Space:minus,1303:Other_People:plus,1303:Other_People:minus,1304:Privacy:plus,1304:Privacy:minus,1305:Noise_Level:plus,1305:Noise_Level:minus,1306:Air_Quality_Temperature:plus,1306:Air_Quality_Temperature:minus,1307:Cleanliness:plus,1307:Cleanliness:minus,1308:General_Atmosphere_Design:plus,1308:General_Atmosphere_Design:minus,1309:Scenery:plus,1309:Scenery:minus,2102:Road_Path_Availability_And_Safety:plus,2102:Road_Path_Availability_And_Safety:minus,2103:Accessibility_Escalators_Lifts_Ramps_Stairs_Etc:plus,2103:Accessibility_Escalators_Lifts_Ramps_Stairs_Etc:minus,2104:Traffic_Signals_Crossings:plus,2104:Traffic_Signals_Crossings:minus,2107:Ability_To_Carry_Bags_Luggage_Etc:plus,2107:Ability_To_Carry_Bags_Luggage_Etc:minus,2109:Crowding_Congestion:plus,2109:Crowding_Congestion:minus,2110:Predictability_Of_Travel_Time:plus,2110:Predictability_Of_Travel_Time:minus,2111:Benches_Toilets_Etc:plus,2111:Benches_Toilets_Etc:minus,2112:Facilities_Shower_Lockers:plus,2112:Facilities_Shower_Lockers:minus,2113:Parking_At_End_Points:plus,2113:Parking_At_End_Points:minus,2202:Road_Path_Quality:plus,2202:Road_Path_Quality:minus,2203:Road_Path_Directness:plus,2203:Road_Path_Directness:minus,2206:Lighting_Visibility:plus,2206:Lighting_Visibility:minus,2207:Urban_Scenery_Atmosphere:plus,2207:Urban_Scenery_Atmosphere:minus,2210:Cars_Other_Vehicles:plus,2210:Cars_Other_Vehicles:minus,3102:Traffic_Congestion_Delays:plus,3102:Traffic_Congestion_Delays:minus,3103:Predictability_Of_Travel_Time:plus,3103:Predictability_Of_Travel_Time:minus,3202:Road_Quality_Vehicle_Ride_Smoothness:plus,3202:Road_Quality_Vehicle_Ride_Smoothness:minus,3203:Vehicle_Quality:plus,3203:Vehicle_Quality:minus,3206:Seat_Comfort:plus,3206:Seat_Comfort:minus,3211:Other_Passengers:plus,3211:Other_Passengers:minus,3212:Other_Cars_Vehicles:plus,3212:Other_Cars_Vehicles:minus,otherFactor,averagePointLat,averagePointLon,legDistance,legDuration,legAverageSpeed,legMaxSpeed,modeOfTransport,detectedModeOfTransport,correctedModeOfTransport,trueDistance,wasMerged,wasSplit,otherMotText\n";
    for (var i=0; i<trips.length; i++){
      var trip = trips[i];
      for(var j=0; j<trip.legs.length; j++){
        var leg = trip.legs[j];
        content += trip.tripid + "," 
                + this.processArray(trip.​​startAddress) + ","
                + this.processArray(trip.finalAddress) + ","
                + trip.​​tripStartDate + ","
                + trip.tripEndDate + ","
                + trip.tripValidationDate + ","
                + trip.​​​model + ","
                + trip.​​​oS + ","
                + trip.​​​oSVersion + ","
                + this.processArray(trip.​​​cityInfo) + ","
                + this.processArray(trip.​​​countryInfo) + ","
                + trip.​​​duration + ","
                + trip.​​​distance + ","
                + trip.​​​manualTripStart + ","
                + trip.manualTripEnd + ","
                + trip.averageSpeed + ","
                + trip.​​​maxSpeed + ","
                + trip.overallScore + ","
                + this.processObjectives(trip.objectives) + ","
                + trip.​​​numMerges + ","
                + trip.​​​numSplits + ","
                + trip.​​​numDeletes + ","
                + trip.shareInformation + ","
                + trip.​​​usetripMoreFor + ","
                + trip.​​​didYouHaveToArrive + ","
                + trip.​​​howOften + ","
                + leg.legid + ","
                + leg.class + ","
                + leg.startDate + ","
                + leg.endDate + ","
                + leg.wastedTime + ","
                + this.processValueFromTrip(leg.valueFromTrip) + ","
                + this.processGenericActivities(leg.genericActivities) + ","
                + this.processFactors(leg.activitiesFactors,leg.comfortAndPleasentFactors,leg.whileYouRideFactors,leg.gettingThereFactors,leg.correctedModeOfTransport) + ","
                + this.processArray(leg.otherFactor) + ","
                + leg.averagePointLat + ","
                + leg.averagePointLon + ","
                + leg.legDistance + ","
                + leg.legDuration + ","
                + leg.averageSpeed + ","
                + leg.maxSpeed + ","
                + leg.modeOfTransport + ","
                + leg.detectedModeOfTransport + ","
                + leg.correctedModeOfTransport + ","
                + leg.trueDistance + ","
                + leg.wasMerged + ","
                + leg.wasSplit + ","
                + leg.otherMotText + "\n";
      }
    }
    return content;
  }
    
  /**
   * Build users csv
   * 
   * @param users 
   */
  buildUsersCsv(users): string {

    var processPreferredModes = function (prefferedModes) {
      var modesContent = "";
      prefferedModes.forEach(element => {
        modesContent += element.Mot + "," + element.MotText + "," + element.motsProd + "," + element.motsRelax + "," + element.motsFit + ","
      });
      return modesContent;
    };

    var content = "userid,registerTimestamp,onCampaigns,prodValue,relValue,actValue,name,country,city,minAge,maxAge,gender,degree,hasSetMobilityGoal,mobilityGoalChosen,\
    mobilityGoalPoints,lang,maritalStatusHousehold,numberPeopleHousehold,yearsOfResidenceHousehold,labourStatusHousehold,pointsPerCampaign,workAddress,homeAddress,\
    Mode of transport - code,Mode of transport - name,Mode of transport - prod, Mode of transport - relax,Mode of transport - fit\n";

    for (var i=0; i<users.length; i++){
      var currUser = users[i];
      content += currUser.userid + "," + currUser.registerTimestamp + "," + this.processArray(currUser.onCampaigns) + ",";
      if (currUser.userSettings !== undefined){
        content += + currUser.userSettings.prodValue + ","
        + currUser.userSettings.relValue + ","
        + currUser.userSettings.actValue + ","
        + currUser.userSettings.name + ","
        + currUser.userSettings.country + ","
        + currUser.userSettings.city + ","
        + currUser.userSettings.minAge + ","
        + currUser.userSettings.maxAge + ","
        + currUser.userSettings.gender + ","
        + currUser.userSettings.degree + ","
        + currUser.userSettings.hasSetMobilityGoal + ","
        + currUser.userSettings.mobilityGoalChosen + ","
        + currUser.userSettings.mobilityGoalPoints + ","
        + currUser.userSettings.lang + ","
        + currUser.userSettings.maritalStatusHousehold + ","
        + currUser.userSettings.numberPeopleHousehold + ","
        + currUser.userSettings.yearsOfResidenceHousehold + ","
        + currUser.userSettings.labourStatusHousehold + ","
        + this.processArray(currUser.userSettings.pointsPerCampaign) + ","
        + this.getAddress(currUser.userSettings.workAddress) + ","
        + this.getAddress(currUser.userSettings.homeAddress) + ","
        + processPreferredModes(currUser.userSettings.preferedMots) +  "\n";
      } else {
        content += ",,,,,,,,,,,,,,,,,,,,\n";
      }
    }
    return content;
  }

  /**
   * Build trips and users csv
   * 
   * @param tripsAndUsers 
   */
  buildTripsAndUsersCsv(tripsAndUsers) : string {
    var content = "userid,tripid,startDate\n";
    for (var i=0; i<tripsAndUsers.length; i++){
      var currElem = tripsAndUsers[i];
      content += currElem.userid + "," + currElem.tripid + ","  + currElem.startDate + "\n";
    }
    return content;
  }

  /**
   * Exports trips data
   * Expots also a relation between tripids-userids-startDate
   */
  exportTripDataOfCampaign(){
    var campaignId;
    var filename;
    if (this.selectedCampaignToExport === "All"){
      campaignId = "";
      filename = "campaignsTripsData";
    } else {
      campaignId = this.selectedCampaignToExport.campaignId;
      filename = this.selectedCampaignToExport.name + "_tripsData";
    }
    this.campaignService.exportTripsDataOfCampaign(campaignId).then( (response) => {
      var res = response["trips"];
      console.log(response)
      // download file :
      const link = document.createElement('a');
      document.body.appendChild(link);
      var blob;
      if(this.selectedFormat === "JSON"){
        blob = new Blob([JSON.stringify(res, null, 2)], { type: 'octet/stream' });
        link.download = filename + ".json";
      } else {
        var csv = this.buildTripsCsv(res);
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
   * Exports user profiles
   */
  exportUsersDataOfCampaign() {
    var campaignId;
    var filename;
    if (this.selectedCampaignToExport === "All"){
      campaignId = "";
      filename = "campaignsUsersData";
    } else {
      campaignId = this.selectedCampaignToExport.campaignId;
      filename = this.selectedCampaignToExport.name + "_usersData";
    }

    this.campaignService.exportUsersDataOfCampaign(campaignId).then( (res) => {
      for(var i=0;i<res.length;i++){
        var currUserSettings = res[i].userSettings
        if(currUserSettings===undefined){
          continue;
        }
        this.correctGender(currUserSettings);
        if(currUserSettings.homeAddress!=undefined && currUserSettings.homeAddress.location!=undefined){
          delete currUserSettings.homeAddress.location;
        }
        if(currUserSettings.workAddress!=undefined && currUserSettings.workAddress.location!=undefined){
          delete currUserSettings.workAddress.location;
        }
      }
      // download file :
      const link = document.createElement('a');
      document.body.appendChild(link);
      var blob;
      if(this.selectedFormat === "JSON"){
        blob = new Blob([JSON.stringify(res, null, 2)], { type: 'octet/stream' });
        link.download = filename + ".json";
      } else {
        var csv = this.buildUsersCsv(res);
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
   * Build csv for legs start and end position
   * 
   * @param legs 
   */
  buildLegStartEnd(legs){
    var content = "legId,StartLat,StartLon,EndLat,EndLon\n"
    for(var i = 0; i<legs.length;i++){
      content+=legs[i].legId+","+legs[i].startPoint.lat+","+legs[i].startPoint.lon+","+legs[i].endPoint.lat+","+legs[i].startPoint.lon+"\n";
    }
    return content;
  }

  /**
   * Returns a file with legids and their startPoint and endPoint
   */
  exportLegStartEnd(){
    var campaignId = this.selectedCampaignToExport.campaignId;
    this.campaignService.getLegsStartEnd(campaignId).then((res) => {
      var trips = res.trips
      var totalLegs = [];
      for(var i=0;i<trips.length;i++){
        var legs = trips[i].legs
        for(var h=0;h<legs.length;h++){
          totalLegs.push(legs[h]);
        }
      }
      var filename = this.selectedCampaignToExport.name+"_legsStartEnd";
      const link = document.createElement('a');
      document.body.appendChild(link);
      var blob;
      var csv = this.buildLegStartEnd(totalLegs);
      blob = new Blob([csv], { type: 'text/csv;charset=utf-8;base64' });
      link.download = filename + ".csv";
      
      var url = window.URL.createObjectURL(blob);
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    })
  }

  /**
   * Returns a file with relation between tripid-userid-startDate
   */
  exportTripsAndUsersDataOfCampaign(){
    var campaignId;
    var filename;
    if (this.selectedCampaignToExport === "All"){
      campaignId = "";
      filename = "campaignsTripsUsersRelationData";
    } else {
      campaignId = this.selectedCampaignToExport.campaignId;
      filename = this.selectedCampaignToExport.name + "_tripsUsersRelationData";
    }

    this.campaignService.exportTripsAndUsersDataOfCampaign(campaignId).then( (res) => {
      // download file :
      const link = document.createElement('a');
      document.body.appendChild(link);
      var blob;
      if(this.selectedFormat === "JSON"){
        blob = new Blob([JSON.stringify(res, null, 2)], { type: 'octet/stream' });
        link.download = filename + ".json";
      } else {
        var csv = this.buildTripsAndUsersCsv(res);
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
}