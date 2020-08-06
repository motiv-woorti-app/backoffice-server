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
import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {SurveyDataPassingServiceService} from '../survey-data-passing-service.service';
import {SelectionModel} from '@angular/cdk/collections';
import {MatDatepickerInputEvent, MatTable, MatTableDataSource} from '@angular/material';
import {MotivUser, UserConnectionsService} from '../../../providers/user-connections.service';
import {CampaignService, MotivCampaign} from '../../../providers/campaign.service';
import {Launch, SurveyConnectionsService} from '../../../providers/survey-connections.service';
import {Location} from '@angular/common';
import {FormControl} from '@angular/forms';
import {UtilsService} from "../../../providers/utils.service";

@Component({
  selector: 'app-old_launch',
  templateUrl: './old_launch.component.html',
  styleUrls: ['./old_launch.component.css']
})
export class OldLaunchComponent implements OnInit {

  users;

  columnsToShowUsers;

  initialSelection;

  selection;

  startDateTS;

  launchToBeSent;

  surveyToBeLaunched;
  launching;

  dateToBeUsed;
  date = new FormControl(new Date());

  columnsToShowCampaign;

  targetedCampaigns = [];
  fromTargetAge=1;
  toTargetAge=99;

  constructor( private dataService: SurveyDataPassingServiceService,
                private userConnectionService: UserConnectionsService,
               private location: Location,
               private surveyConnectionService: SurveyConnectionsService,
               private campaignService: CampaignService,
               private utilService: UtilsService
  ) { }

  ngOnInit() {
    console.log(this.dataService.surveyToBePassed);

    this.columnsToShowUsers = ['select', 'userid', 'email'];
    this.userConnectionService.getMotivUsersFromServer(this.callbackGetUsers.bind(this));

    this.initialSelection = [];
    this.selection = new SelectionModel<MotivUser>(true, this.initialSelection);

    this.launching = this.dataService.getLaunching();

    const dateT = new Date();
    dateT.setHours(0,0,0,0);

    this.dateToBeUsed = dateT.valueOf();

    this.date = new FormControl(dateT);

    if (!this.launching) {
      this.surveyToBeLaunched = this.dataService.getSurveyToBePassed();
      this.rebuildLaunchData(this.surveyToBeLaunched);
    }

    this.campaignService.getMotivManagedCampaignsFromServer();
    this.columnsToShowCampaign = ['campaignId', 'campaignName', 'campaignCountryCity', 'actionsColumn'];

    this.surveyToBeLaunched = this.dataService.getSurveyToBePassed();
  }

  /**
   * Get users
   */
  getUsers() {

    const users = this.userConnectionService.getMotivUsers();

    return users;
  }

  /**
   * Get country name by its iso
   * 
   * @param countryIso 
   */
  getCountryNameByIso(countryIso: string){
    return this.utilService.getCountryNameByCountryIso(countryIso);
  }

  /**
   * Rebuild launch data
   * 
   * @param launchData 
   */
  rebuildLaunchData(launchData: Launch) {

    this.startDateTS = this.surveyToBeLaunched.launch.startDateTS;
    this.date = new FormControl(new Date(this.surveyToBeLaunched.launch.launchDate));

    this.selection = new SelectionModel<MotivUser>(true, this.getUsers().filter(x => this.surveyToBeLaunched.launch.users.includes(x.userid)));

    console.log(new Date(this.surveyToBeLaunched.launch.launchDate));
  }

  /**
   * Apply filter
   * 
   * @param filterValue 
   */
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
    this.users.filter = filterValue;
  }

  /**
   * Whether the number of selected elements matches the total number of rows
   */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.getUsers().length;
    return numSelected === numRows;
  }

  /** 
   * Selects all rows if they are not all selected; otherwise clear selection. 
   * 
   * */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.getUsers().forEach(row => this.selection.select(row));
  }

  /**
   * Get managed campaigns
   */
  getManagedCampaigns() {
    return this.campaignService.getMotivManagedCampaigns();
  }

  
  /**
   * Target campaign
   * 
   * @param row 
   */
  targetCampaign(row) {
    if(!this.targetedCampaigns.includes(row)){
      this.targetedCampaigns.push(row);
    }
    this.recomputeTargetedUsers();
  }

  /**
   * Recompute target users
   */
  recomputeTargetedUsers(){

    const usersWithinAge = this.getUsers().filter(x => x.age <= this.toTargetAge && x.age >= this.fromTargetAge);
    console.log(usersWithinAge);

    const campaignIDS = this.targetedCampaigns.map(x => x.campaignId);
    console.log(campaignIDS);

    const usersInCampaign = this.getUsers().filter(x => x.onCampaigns.filter( y => campaignIDS.includes(y)).length > 0);

    const result = usersWithinAge.filter(function(n) {
      return usersInCampaign.indexOf(n) > -1;
    });

    console.log(result);

    this.selection = new SelectionModel<MotivUser>(true, result);
  }

  /**
   * Untarget campaign
   * 
   * @param row 
   */
  untargetCampaign(row) {
    console.log('Deleting ' + row);
    const index = this.targetedCampaigns.indexOf(row);
    this.targetedCampaigns.splice(index, 1);
    this.recomputeTargetedUsers();
  }

  /**
   * Callback get users
   */
  callbackGetUsers() {
    console.log();
    this.users = new MatTableDataSource(this.getUsers());
    if (!this.launching) {
      this.initialSelection = this.getUsers().filter(x => this.surveyToBeLaunched.launch.users.includes(x.userid));
    } else {
      this.initialSelection = [];
    }
    this.selection = new SelectionModel<MotivUser>(true, this.initialSelection);
  }

  /**
   * Change start date
   * 
   * @param type 
   * @param event 
   */
  changeStartDate(type: string, event: MatDatepickerInputEvent<Date>) {
    this.dateToBeUsed = event.value.valueOf();
  }

  /**
   * On submit survey
   */
  onSubmit() {

    const targetedCampaignIDs = this.targetedCampaigns.map(x => x.campaignId);
    this.launchToBeSent = new Launch(this.selection.selected.map( user => user.userid), undefined, this.dateToBeUsed, this.fromTargetAge, this.toTargetAge, targetedCampaignIDs);

    this.surveyConnectionService.launchSurvey(this.launchToBeSent, this.surveyToBeLaunched.globalSurveyTimestamp, this.responseHandler.bind(this));
  }

  /**
   * Handler for response
   * @param resp 
   */
  responseHandler(resp) {
    console.log(resp);
    if (resp.ok) {
        alert('Survey launch created successfully!');
      this.location.back();
    } else {
      alert('Launch not sent to server - ' + resp.statusText);
    }
  }
}