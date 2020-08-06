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
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MotivUser, UserConnectionsService} from '../../../providers/user-connections.service';
import {SelectionModel} from '@angular/cdk/collections';
import {selector} from 'rxjs-compat/operator/publish';
import {CampaignService, MotivCampaign} from '../../../providers/campaign.service';
import {Location} from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {MatTable, MatTableDataSource} from '@angular/material';
import { UtilsService } from 'src/app/providers/utils.service';

@Component({
  selector: 'app-create-campaign',
  templateUrl: `./create-campaign.component.html`,
  styleUrls: ['./create-campaign.component.css']
})

//Component responsible for campaign creation/edit
export class CreateCampaignComponent implements OnInit, OnDestroy {

  campaignName: string;
  campaignCountryIdx : number;
  campaignCityIdx;

  campaignDescription: string = "";
  pointsTripPurpose: string = "20";
  pointsTransportMode: string = "5";
  pointsWorth: string = "5";
  pointsActivities: string = "5";
  pointsAllInfo: string = "15";

  initLat: number = 41.899092;
  initLng: number = 12.502915;
  lat: number = this.initLat;
  lng: number = this.initLng;
  radius: number = 20000;

  campaignId;

  selection;

  columnsToShowUsers;

  campaignToBeSubmitted;

  editing: boolean;
  campaignData: MotivCampaign;

  usersManagers;

  initialSelection = [];
  listOfUsersInCampaign = [];

  campaignTypes = ["Public", "Private"];
  currentType : string;
  privateCode : string;

  cityOtherText = "";
  listOfCountries;


  listOfCities = {
    "PRT" : ["Lisbon", "Porto"],
    "SVK" : ["Žilina", "Bratislava", "Trnava", "Nitra", "Trenčín", "Banská Bystrica", "Košice", "Prešov"],
    "FIN" : ["Helsinki", "Tampere", "Turku", "Oulu", "Etelä-Suomi", "Länsi-Suomi", "Keski-Suomi", "Itä-Suomi", "Pohjois-Suomi"], 
    "ESP" : ["Barcelona", "Girona", "Tarragona", "Lleida"],
    "BEL" : ["Antwerp", "Brugge", "Brussels", "Gent", "Leuven"],
    "CHE" : ["Lausanne","Genève", "Montreux", "Fribourg", "Bern", "Basel", "Zurich", "Neuchâtel", "Yverdon-les-Bains"],
    "ITA" : ["Milan"],
    "FRA" : ["Paris", "Lyon", "Grenoble", "Nevers", "Nantes", "Bordeaux", "Toulouse", "Strasbourg", "Amiens", "Angers", "Lille", "Brest", "Marseille", "Saint Brieuc", "Montpellier"],
    "NOR" : ["Oslo", "Bergen", "Trondheim", "Stavager", "Drammen", "Fredrikstad", "Porsgrunn", "Skien", "Kristiansand", "Ålesund", "Tønsberg"],
    "HRV" : ["Zagreb", "Velika Gorica", "Samobor", "Zaprešić", "Dugo selo", "Zagrebačka županija", "Split", "Rijeka", "Osijek", "Varaždin", "Zadar"]
  };

  @ViewChild('uTable') table: MatTable<MotivUser>;

  constructor(
    private userConnectionService: UserConnectionsService,
    private campaignService: CampaignService,
    private location: Location,
    private route: ActivatedRoute,
    private utilService: UtilsService
  ) {

  }

  /**
   * event handler when selecting a center for "any by radius" campaigns
   * 
   * @param $event 
   */
  centerChange($event){
    console.log("Coords updated!!", $event);
    this.lat = Number($event.lat.toFixed(6));
    this.lng = Number($event.lng.toFixed(6));
  }

  /**
   * Apply filter to a string
   * 
   * @param filterValue 
   */
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.usersManagers.filter = filterValue;

  }

  ngOnDestroy() {

  }

  /**
   * init component
   */
  ngOnInit() {
    this.columnsToShowUsers = ['select', 'userid', 'email'];
    this.userConnectionService.getMotivUsersFromServer(this.callbackGetUsers.bind(this));

    this.listOfCountries = this.utilService.getCountryListObjects();

    this.route.queryParams.subscribe(params => {
      var campId = params['campaignId'];
      if (campId === ''){
        this.editing = false;
      } else {
        this.editing = true;
        console.log("CAMP ID: " + campId);
        this.campaignData = this.campaignService.getMotivManagedCampaigns().find(campaign => campaign.campaignId === campId);
        console.log("Campaign data: ", this.campaignData);
        this.rebuildCampaignData(this.campaignData);
      }
    });
    this.initialSelection = [];
    this.selection = new SelectionModel<MotivUser>(true, this.initialSelection);
  }

  ngAfterViewInit() {
    window.scrollTo(0, 0);
  }

  /**
   * Rebuild campaign data
   * 
   * @param campaignData 
   */
  rebuildCampaignData(campaignData: MotivCampaign) {
    this.campaignName = campaignData.name;
    this.campaignDescription = campaignData.campaignDescription;
    this.pointsTripPurpose = campaignData.pointsTripPurpose.toString();
    this.pointsTransportMode = campaignData.pointsTransportMode.toString();
    this.pointsWorth = campaignData.pointsWorth.toString();
    this.pointsActivities = campaignData.pointsActivities.toString();
    this.pointsAllInfo = campaignData.pointsAllInfo.toString();

    var countryIndex;
    for (var i=0; i<this.listOfCountries.length; i++){
      if (this.listOfCountries[i].iso === campaignData.country){
        countryIndex = i;
        break;
      }
    }
    this.campaignCountryIdx = countryIndex;
    if (campaignData.city === "Any city"){
      this.campaignCityIdx = '-2';
    } else if (campaignData.city === "Any by radius") {
      this.campaignCityIdx = '-3';
      this.initLat = campaignData.location.lat;
      this.initLng = campaignData.location.lon;
      this.lat = this.initLat;
      this.lng = this.initLng;
      this.radius = campaignData.radius;
    } else {
      var citiesOfCurrCountry = this.listOfCities[this.listOfCountries[this.campaignCountryIdx].iso];
      if (citiesOfCurrCountry === undefined){
        this.campaignCityIdx = '-1';
        this.cityOtherText = campaignData.city;
      } else {
        var cityIdxInitialized = false;
        for (var i=0; i<citiesOfCurrCountry.length; i++){
          if (citiesOfCurrCountry[i] === campaignData.city){
            this.campaignCityIdx = i;
            cityIdxInitialized = true;
            break;
          }
        }
        if (!cityIdxInitialized){
          this.campaignCityIdx = '-1';
          this.cityOtherText = campaignData.city;
        }
      }
    }
    this.campaignId = campaignData.campaignId;
    this.privateCode = campaignData.privateCode;
    if(campaignData.isPrivate){
      this.currentType = "Private";
    } else {
      this.currentType = "Public";
    }
    this.listOfUsersInCampaign = campaignData.usersOnCampaign;
  }

  /**
   * Get users
   */
  getUsers() {
    const users = this.userConnectionService.getMotivUsers().filter(x => x.roles.includes('CM'));
    return users;
  }

  /**
   * Get cities of current country
   */
  getCitiesOfCurrentCountry(){
    var currCountryObj = this.listOfCountries[this.campaignCountryIdx]
    if (currCountryObj === undefined) {
      return [];
    }
    var citiesList = this.listOfCities[currCountryObj.iso];
    if (citiesList === undefined){
      return [];
    }
    return citiesList;
  }

  /**
   * Callback get users
   */
  callbackGetUsers() {
    console.log();
    this.usersManagers = new MatTableDataSource(this.getUsers());

    if (this.editing) {
      this.initialSelection = this.getUsers().filter(x => this.campaignData.campaignManagers.includes(x.userid));
    } else {
      this.initialSelection = [];
    }

    this.selection = new SelectionModel<MotivUser>(true, this.initialSelection);
  }

  /**
   * Validate Private Code
   */
  validatePrivateCode() {
    if (this.privateCode === undefined || this.privateCode.length < 3) {
      alert('Minimum length of the code is 3 characters!');
    }
    else {
      this.campaignService.validatePrivateCode(this.privateCode).then( (response) => {
        var isValidCode = response.body.isValidCode;
        console.log("iSValidCode: " + isValidCode);
        if (isValidCode){
          alert('This code can be used!');
        } else {
          alert('This code cannot be used (used by other campaign already)!');
        }
      });
    }
  }

  /**
   * On campaign submit action
   */
  onSubmit() {
    var isPrivate = false;
    if(this.currentType === "Private"){
      isPrivate = true;
    }

    var pointsTripPurposeInt = parseInt(this.pointsTripPurpose);
    var pointsTransportModeInt = parseInt(this.pointsTransportMode);
    var pointsWorthInt = parseInt(this.pointsWorth);
    var pointsActivitiesInt = parseInt(this.pointsActivities);
    var pointsAllInfoInt = parseInt(this.pointsAllInfo);

    var countryIso = this.listOfCountries[this.campaignCountryIdx].iso;
    var cityName;
    if (this.campaignCityIdx === '-1'){
      cityName = this.cityOtherText;
      this.radius = 0;
      this.lat = 0;
      this.lng = 0;
    } else if (this.campaignCityIdx === '-2'){
      cityName = "Any city";
      this.radius = 0;
      this.lat = 0;
      this.lng = 0;
    } else if (this.campaignCityIdx === '-3') {
      cityName = "Any by radius";
    } else {
      cityName = this.listOfCities[countryIso][this.campaignCityIdx];
      this.radius = 0;
      this.lat = 0;
      this.lng = 0;
    }

    this.campaignToBeSubmitted = new MotivCampaign(
      this.campaignId,
      isPrivate,
      this.privateCode,
      this.campaignName,
      this.campaignDescription,
      pointsTripPurposeInt,
      pointsTransportModeInt,
      pointsWorthInt,
      pointsActivitiesInt,
      pointsAllInfoInt,
      countryIso,
      cityName,
      Number(this.radius.toFixed(3)),
      this.lng,
      this.lat,
      true,
      this.listOfUsersInCampaign,
      this.selection.selected.map( user => user.userid)
    );

    console.log(this.selection.selected.map( user => user.userid));

    if (this.editing) {
      console.log(this.campaignToBeSubmitted);
      this.campaignService.editCampaign(this.campaignToBeSubmitted, this.responseHandler.bind(this));
    } else {
      console.log(this.campaignToBeSubmitted);
      this.campaignService.newCampaign(this.campaignToBeSubmitted, this.responseHandler.bind(this));
    }

  }

  /**
   * Response handler
   * 
   * @param resp 
   */
  responseHandler(resp) {
    console.log(resp);
    if (resp.ok) {
      if (this.editing) {
        alert('Campaign edited successfully!');
      } else {
        alert('Campaign created successfully!');
      }
      this.location.back();
    } else {
      alert('Campaign not sent to server - ' + resp.statusText);
    }
  }
}