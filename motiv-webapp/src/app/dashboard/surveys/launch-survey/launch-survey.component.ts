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

import * as moment from 'moment';
import { CampaignService } from 'src/app/providers/campaign.service';
import { UtilsService } from 'src/app/providers/utils.service';
import { FormControl, Validators } from '@angular/forms';
import { Launch, SurveyConnectionsService } from 'src/app/providers/survey-connections.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-launch-survey',
  templateUrl: './launch-survey.component.html',
  styleUrls: ['./launch-survey.component.css']
})
export class LaunchSurveyComponent implements OnInit {

  surveyToBeLaunched;

  startDate;
  endDate;

  columnsToShowCampaign;

  targetedCampaigns = [];
  usersList = [];
  numberOfTargetUsers = 0;
  targetCampaignsForm = new FormControl('', [Validators.required]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private utilService: UtilsService,
    private surveyConnectionService: SurveyConnectionsService
  ) { }

  ngOnInit() {
    this.campaignService.getMotivManagedCampaignsFromServer();
    this.columnsToShowCampaign = ['campaignId', 'campaignName', 'campaignCountryCity', 'actionsColumn'];

    this.route.queryParams.subscribe(params => {
      var surveyToLaunch = params["survey"];
      this.surveyToBeLaunched = JSON.parse(surveyToLaunch);
    });
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
   * Get country name by iso
   * 
   * @param countryIso 
   */
  getCountryNameByIso(countryIso: string) {
    return this.utilService.getCountryNameByCountryIso(countryIso);
  }

  /**
   * Update users list
   * 
   * @param selectedCampaigns 
   */
  updateUsersList(selectedCampaigns){
    this.usersList = [];
    var usersListWithDuplicates = [];
    selectedCampaigns.forEach(campaign => {
      usersListWithDuplicates.push(...campaign.usersOnCampaign);
    });
    // remove duplicates:
    this.usersList = Array.from(new Set(usersListWithDuplicates));
    this.numberOfTargetUsers = this.usersList.length;
  }

  /**
   * Target campaigns changed
   * 
   * @param selectedCampaigns 
   */
  targetCampaignsChanged(selectedCampaigns){
    this.updateUsersList(selectedCampaigns);
  }

  /**
   * On submit survey
   */
  onSubmit() {
    if (this.targetCampaignsForm.hasError('required')){
      console.log("Form error!");
      return;
    }
    const confirmMessage = "Are you sure you want to launch the survey to your users? Check-list suggestion: 1) make sure there are no typos, 2) make sure any needed translations of the questions have been submitted,  3) if needed you can test the survey in a test campaign. Launch survey?";
    if (confirm(confirmMessage)){
      var startDateTs = this.startDate.valueOf();
      var campaignsIds = this.targetCampaignsForm.value.map(x => x.campaignId);
      // old variables, not used anymore:
      var old_fromTargetAge = 1;
      var old_toTargetAge = 99;
      var launchToBeSent = new Launch(this.usersList, undefined, startDateTs, old_fromTargetAge, old_toTargetAge, campaignsIds);
      this.surveyConnectionService.launchSurvey(launchToBeSent, this.surveyToBeLaunched.globalSurveyTimestamp, this.responseHandler.bind(this));
  }
  }

  /**
   * Handler for responses
   * 
   * @param resp 
   */
  responseHandler(resp) {
    console.log(resp);
    if (resp.ok) {
      alert('Survey launch created successfully!');
      this.router.navigate(['..'], { relativeTo: this.route }); // prev page
    } else {
      alert('Launch not sent to server - ' + resp.statusText);
    }
  }
}