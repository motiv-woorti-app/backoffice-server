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
import { Survey, SurveyConnectionsService } from 'src/app/providers/survey-connections.service';
import { UtilsService } from 'src/app/providers/utils.service';
import { CampaignService } from 'src/app/providers/campaign.service';
import { UserConnectionsService } from 'src/app/providers/user-connections.service';

@Component({
  selector: 'app-view-survey',
  templateUrl: './view-survey.component.html',
  styleUrls: ['./view-survey.component.css']
})
export class ViewSurveyComponent implements OnInit {

  currentSurvey : Survey;
  targetCampaigns;
  usersOfSurvey;
  numberOfAnswers;

  columnsOfQuestions = ["id", "question", "type"];

  constructor(
    private route: ActivatedRoute,
    private surveyConnectionService: SurveyConnectionsService,
    private utilsService: UtilsService,
    private campaignsService : CampaignService,
    private userConnectionService : UserConnectionsService
  ) { }

  ngOnInit() {
    var surveyidStr = this.route.snapshot.params['surveyid'];
    var surveyid = Number.parseInt(surveyidStr, 10);
    this.currentSurvey = this.surveyConnectionService.getLocalSurveyById(surveyid);
    console.log("SURV: ", this.currentSurvey);
    this.campaignsService.getCampaignsByListOfIds(this.currentSurvey.launch.campaignIDs).then( campaigns => {
      this.targetCampaigns = campaigns;
    });

    this.userConnectionService.getUsersByIds(this.currentSurvey.launch.users).then ( users => {
      this.usersOfSurvey = users;
    });

    this.surveyConnectionService.getNumberOfAnswersOfSurvey(surveyid).then (numAnswers => {
      this.numberOfAnswers = numAnswers;
    });
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Get trigger info
   */
  getTriggerInfo(): string{
    if (this.currentSurvey.trigger["type"] === "timedTrigger"){
      return "Single event at : " + this.getReadableTime(this.currentSurvey.trigger["timestamp"]);
    }
    else if (this.currentSurvey.trigger["type"] === "eventTrigger"){
      return "Event trigger : " + this.currentSurvey.trigger["trigger"];
    }
    else if (this.currentSurvey.trigger["type"] === "timedRecurringTrigger"){
      return "Repeatable event : First date - " + this.getReadableTime(this.currentSurvey.trigger["startday"]) + ", repeat each - " + this.currentSurvey.trigger["timeInBetween"] + " days.";
    }
    else {
      return this.currentSurvey.trigger["timestamp"];
    }
  }

  /**
   * Timestamp to date
   * 
   * @param timestamp 
   */
  getReadableTime(timestamp) {
    return this.utilsService.getReadableTime(timestamp);
  }

  /**
   * Get names of target campaigns
   */
  getNamesOfTargetCampaigns(){
    if (this.targetCampaigns) {
      var targetCmps = "";
      this.targetCampaigns.forEach(element => {
        targetCmps += element.name + ", ";
      });
      targetCmps = targetCmps.slice(0, targetCmps.length - 2);
      return targetCmps;
    } else {
      return "-";
    }
  }
}