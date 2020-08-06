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
import { Reward, CampaignService } from 'src/app/providers/campaign.service';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from 'src/app/providers/utils.service';
import * as moment from 'moment';

@Component({
  selector: 'app-manage-reward',
  templateUrl: './manage-reward.component.html',
  styleUrls: ['./manage-reward.component.css']
})
export class ManageRewardComponent implements OnInit {

  columnsOfUserToShow = ["email", "name", "currValue"];

  rewardToEdit: Reward; // can be null
  rewardStatus;
  usersOfReward;
  targetCampaignName: string;
  hasDate;

  usersEmails;
  usersEmailsBoolean=false;
  constructor(
    private route: ActivatedRoute,
    private campaignService: CampaignService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      var rewardId: string = params["rewardId"];
      this.targetCampaignName = params["campaignName"];
      this.campaignService.getRewardById(rewardId).then(reward => {
        if(reward["targetType"]>3){
          this.hasDate=true;
        }
        else{
          this.hasDate=false;
        }
        console.log("Received reward: ", reward);
        this.rewardToEdit = reward;
        // get users of campaign:
        this.campaignService.getUsersOfCampaign(this.rewardToEdit.targetCampaignId).then(users => {
          console.log("Received users: ", users);
          this.usersOfReward = users;
        });
      });

      this.campaignService.getStatusOfReward(rewardId).then(rewardStatus => {
        console.log("Received status: ", rewardStatus);
        this.rewardStatus = rewardStatus;
      });

    });
  }

  /**
   * Get readable time (timestamp to date)
   * 
   * @param timestamp 
   */
  getReadableTime(timestamp) {
    return moment(timestamp).format("D MMMM YYYY");
  }

  /**
   * Get target info
   */
  getTargetInfo(){
    var res = "";
    Reward.getAvailableTargetTypes().forEach(targetType => {
      if (this.rewardToEdit.targetType === targetType.value){
        res = this.rewardToEdit.targetValue + " " + targetType.name;
      }
    });
    return res;
  }

  /**
   * Get target type name
   */
  getTargetTypeName(){
    var res = "";
    Reward.getAvailableTargetTypes().forEach(targetType => {
      if (this.rewardToEdit.targetType === targetType.value){
        res = targetType.name;
      }
    });
    return res;
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
   * Get current value of user
   * 
   * @param user 
   */
  getCurrentValueOfUser(user){
    var rewardStatusOfUser = this.rewardStatus.find(rs => {
      return rs.userid === user.userid;
    });
    if (rewardStatusOfUser) {
      return rewardStatusOfUser.currentValue;
    } else {
      return 0;
    }
  }

  /**
   * Export users progress
   */
  exportUsersProgress() {
    var content = "Email,Name,Current number of " + this.getTargetTypeName() + "\n";
    this.usersOfReward.forEach(user => {
      content += user.email + "," + this.getNameOfUser(user) + "," + this.getCurrentValueOfUser(user) + "\n";
    });

    // download file :
    var filename = "Progress of reward " + this.rewardToEdit.rewardName;
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
    for(var i = 0,size = this.usersOfReward.length; i<size;i++){
      if(i+1==size){
        content+="<"+this.usersOfReward[i]["email"]+">";
        break;
      }
      content+="<"+this.usersOfReward[i]["email"]+">,";
    }
    this.usersEmails = content;
  }
}