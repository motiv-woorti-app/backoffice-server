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
import { Router } from '@angular/router';
import { CampaignService, Reward } from 'src/app/providers/campaign.service';
import * as moment from 'moment';

@Component({
  selector: 'app-rewards',
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.css']
})
export class RewardsComponent implements OnInit {

  columnsToShowReward = ["rewardId", "rewardName", "targerCampaign", "rewardStatus", "rewardActions"];
  listOfRewards : Reward[];
  campaignsOfRewards = [];

  constructor(
    private router: Router,
    private campaignService: CampaignService
  ) { }

  ngOnInit() {
    this.campaignService.getRewards().then(rewards => {
      this.listOfRewards = rewards;

      var campaignsIdsSet = new Set();
      rewards.forEach(reward => {
        campaignsIdsSet.add(reward.targetCampaignId);
      });
      var campaignIds = Array.from(campaignsIdsSet.values());
      this.campaignService.getCampaignsByListOfIds(campaignIds).then(campaigns => {
        this.campaignsOfRewards = campaigns;
      });
    });
  }

  /**
   * Get campaign name by id
   * 
   * @param campaignId 
   */
  getCampaignNameById(campaignId) {
    var campaignName = "";
    this.campaignsOfRewards.forEach(campaign => {
      if (campaign.campaignId === campaignId){
        campaignName = campaign.name;
      }
    });
    return campaignName;
  }

  /**
   * Get reward status
   * 
   * @param reward 
   */
  getRewardStatus(reward: Reward) {
    if (reward.removed) {
      return "Deactivated";
    } else {
      var currTs = moment().valueOf();
      if (currTs < reward.startDate){
        return "Not active yet";
      }
      if (currTs >= reward.startDate && currTs <= reward.endDate){
        return "Active";
      }
      if (currTs > reward.endDate){
        return "Completed";
      }
    }
  }

  /**
   * Can be deactivated
   * 
   * @param reward 
   */
  canBeDeactivated(reward: Reward): boolean {
    var currTs = moment().valueOf();
    if (!reward.removed && currTs <= reward.endDate) {
      return true;
    }
    return false;
  }

  /**
   * Deactivate reward
   * 
   * @param reward 
   */
  deactivateReward(reward: Reward){
    reward.removed = true;
    this.campaignService.editReward(reward).then(resp => {
      console.log("Resp: ", resp);
    });
  }

  /**
   * Navigate to edit reward
   * 
   * @param reward 
   */
  navigateToEditReward(reward: Reward){
    this.router.navigate(['/dashboard/rewards/editReward'], {queryParams: {rewardId: reward.rewardId}});
  }

  /**
   * Navigate to reward management
   * 
   * @param reward 
   */
  navigateToRewardManagement(reward: Reward){
    this.router.navigate(['/dashboard/rewards/manageReward'], {queryParams: {rewardId: reward.rewardId, campaignName: this.getCampaignNameById(reward.targetCampaignId) }});
  }
}