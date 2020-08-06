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
import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {AuthService} from './auth.service';
import {MotivUser} from './user-connections.service';
import {catchError, retry} from 'rxjs/operators';
import {throwError} from 'rxjs';
import {ServerCommunicationService} from './server-communication.service';
import {Launch, Question, Survey, Trigger} from './survey-connections.service';

@Injectable({
  providedIn: 'root'
})
export class CampaignService {

  managedCampaigns: MotivCampaign[];

  constructor(
    private authService: AuthService,
    private serverCommunicationService: ServerCommunicationService
    ) { }

  // Campaign Requests
  // private
  // getManagedCampaigns
  // server returns either managed campaigns if user is CM, either all campaigns if user is Admin

  /**
   * Get Motiv Managed Campaigns from server
   */
  public getMotivManagedCampaignsFromServer(): void {
    console.log( '--- GetCampaigns ');
    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.getManagedCampaigns(token).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        this.managedCampaigns = Array.from(resp.body);
        console.log( 'campaigns len: ' + this.managedCampaigns.length);
      });

    });
  }

  /**
   * Get total trips without duplicates
   */
  public getTotalTripsWithoutDuplicates(): any{
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getTotalTripsWithoutDuplicates(token).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getTotalTripsWithoutDuplicates: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get campaigns by role privileges
   */
  public getCampaignsByRolePrivileges(): any{
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getManagedCampaigns(token).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getCampaignsByRolePrivileges: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

/**
 * Get users of campaign
 * 
 * @param campaignid 
 */
  public getUsersOfCampaign(campaignid: string){
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getCampaignsUsers(token, campaignid).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getUsersOfCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get users and answers of campaign
   * 
   * @param campaignid 
   */
  public getUsersAndAnswersOfCampaign(campaignid: string){
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getCampaignsUsersAndAnswers(token, campaignid).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getUsersAndAnswersOfCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get trip digests
   */
  public getTripDigests(): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getTripDigests(token).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getTripDigests: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Add new user to campaign
   * 
   * @param emailOfUSerToAdd 
   * @param campaignId 
   */
  public addNewUserToCampaign(emailOfUSerToAdd: string, campaignId: string){
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.addUserToCampaign(token, emailOfUSerToAdd, campaignId).subscribe ( (response) => {
          if (response.status === 202){
            console.log("addNewUserToCampaign: error: ", response.body); 
            reject(response.body);
            return;
          }
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("addNewUserToCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Exclude user from campaign
   * 
   * @param emailOfUSerToExclude 
   * @param campaignId 
   */
  public excludeUserFromCampaign(emailOfUSerToExclude: string, campaignId: string){
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.excludeUserFromCampaign(token, emailOfUSerToExclude, campaignId).subscribe ( (response) => {
          if (response.status === 202){
            console.log("excludeUserFromCampaign: error: ", response.body);
            reject(response.body);
            return;
          }
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("excludeUserFromCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Add multiple users to campaign
   * 
   * @param emailsOfUsersToAdd 
   * @param campaignId 
   */
  public addMultipleUsersToCampaign(emailsOfUsersToAdd: string[], campaignId: string){
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.addUsersToCampaign(token, emailsOfUsersToAdd, campaignId).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("addMultipleUsersToCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }


  /**
   * Get Motiv Managed Campaigns
   */
  public getMotivManagedCampaigns(): MotivCampaign[] {
    return this.managedCampaigns;
  }

  /**
   * Get managed campaign by id
   * 
   * @param campId 
   */
  public getManagedCampaignByID(campId: string): MotivCampaign{
    return this.managedCampaigns.find((campaign) => {
      return campaign.campaignId === campId;
    });
  }

  /**
   * Create new campaign
   * 
   * @param campaign 
   * @param responseHandler 
   */
  public newCampaign(campaign: MotivCampaign, responseHandler: (resp) => void): void {
    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.addCampaign(token, campaign).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        console.log(headers);
        this.getMotivManagedCampaignsFromServer();
        responseHandler(resp);

      });
    });
  }

  /**
   * Edit campaign
   * 
   * @param campaign 
   * @param responseHandler 
   */
  public editCampaign(campaign: MotivCampaign, responseHandler: (resp) => void): void {
      this.authService.getToken().then( (token) => {
      this.serverCommunicationService.editCampaign(token, campaign).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        console.log(headers);
        this.getMotivManagedCampaignsFromServer();
        responseHandler(resp);

      });
    });
  }

  /**
   * Get campaign by list of ids
   * 
   * @param campaignsIds 
   */
  public getCampaignsByListOfIds(campaignsIds) : Promise<any>{
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getCampaignsByIds(token, campaignsIds).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getCampaignsByListOfIds: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Validate private code
   * 
   * @param privateCode 
   */
  public validatePrivateCode(privateCode: string) : Promise<any> {
    return this.authService.getToken().then( (token) => {
      return this.serverCommunicationService.validateCampaignPrivateCode(token, privateCode).toPromise();
    });
  }

  /**
   * Export trips data of campaign
   * 
   * @param campaignId 
   */
  public exportTripsDataOfCampaign(campaignId: string = ""): Promise<any>{
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.exportCampaignTripData(token, campaignId).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("exportTripsDataOfCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Export users data of campaign
   * 
   * @param campaignId 
   */
  public exportUsersDataOfCampaign(campaignId: string = ""): Promise<any>{
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.exportCampaignUserData(token, campaignId).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("exportUsersDataOfCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Export trips and users data of campaign
   * 
   * @param campaignId 
   */
  public exportTripsAndUsersDataOfCampaign(campaignId: string = ""): Promise<any>{
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.exportCampaignTripsAndUsersData(token, campaignId).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("exportTripsAndUsersDataOfCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get statistics users trips
   * 
   * @param leftLimitTs 
   * @param rightLimitTs 
   * @param campaignID 
   */
  public getStatisticsUsersTrips(leftLimitTs: number = -1, rightLimitTs: number = -1, campaignID: string = ""): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getGlobalStatistics(token, leftLimitTs, rightLimitTs, campaignID).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getStatisticsUsersTrips: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get trips for mode statistics
   * 
   * @param campaignid 
   */
  public getTripsForModeStatistics(campaignid: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getTripsForModeStatistics(token, campaignid).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getTripsForModeStatistics: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get campaign statistics by id
   * 
   * @param leftLimitTs 
   * @param rightLimitTs 
   * @param campaignid 
   */
  public getCampaignsStatisticsByID(leftLimitTs: number = -1, rightLimitTs: number = -1, campaignid: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getStatisticsByCampaignid(token, leftLimitTs, rightLimitTs, campaignid).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getCampaignsStatisticsByID: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get trip statistics
   * 
   * @param leftLimitTs 
   * @param rightLimitTs 
   */
  public getTripStatistics(leftLimitTs: number, rightLimitTs: number): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getStatisticsOfTrips(token, leftLimitTs, rightLimitTs).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getTripStatistics: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get trip info
   * 
   * @param tripid 
   */
  public getTripInfo(tripid: string): Promise<any> {
    // transform from #XX:XXX format to XX-XXX:
    const tripIdToSendComps = tripid.split(':');
    const tripIdToSend = tripIdToSendComps[0].substr(1) + '-' + tripIdToSendComps[1];

    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getInfoOfTrip(token, tripIdToSend).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getTripInfo: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Create new reward of campaign
   * 
   * @param reward 
   */
  public createNewRewardOfCampaign(reward: Reward): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.addReward(token, reward).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("createNewRewardOfCampaign: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get campaign ids of active rewards
   */
  public getCampaignIdsOfActiveRewards(): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getCampaignIdsOfActiveRewards(token).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getCampaignIdsOfActiveRewards: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get rewards
   */
  public getRewards(): Promise<Reward[]> {
    let promise = new Promise <Reward[]>((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getExistingRewards(token).subscribe ( (response) => {
          if (response.status === 200){
            var rewards : Reward[] = [];
            response.body.forEach(element => {
              var currReward = new Reward(
                element.rewardId,
                element.rewardName,
                element.targetCampaignId,
                element.startDate,
                element.endDate,
                element.targetType,
                element.targetValue,
                element.organizerName,
                element.linkToContact,
                element.removed,
                element.defaultLanguage,
                element.descriptions
              );
              rewards.push(currReward);
            });
            resolve(rewards);
          } else{
            console.log("getRewards: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get rewards by id
   * 
   * @param rewardId
   */
  public getRewardById(rewardId: string): Promise<Reward> {
    let promise = new Promise <Reward>((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getRewardById(token, rewardId).subscribe ( (response) => {
          if (response.status === 200){
            var reward;
            if (response.body === null) {
              reward = null;
            } else {
              reward = new Reward(
                response.body.rewardId,
                response.body.rewardName,
                response.body.targetCampaignId,
                response.body.startDate,
                response.body.endDate,
                response.body.targetType,
                response.body.targetValue,
                response.body.organizerName,
                response.body.linkToContact,
                response.body.removed,
                response.body.defaultLanguage,
                response.body.descriptions
              );
            }
            resolve(reward);
          } else{
            console.log("getRewards: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Edit reward
   * 
   * @param reward 
   */
  public editReward(reward: Reward): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.editReward(token, reward).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("editReward: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get status of reward
   * 
   * @param rewardId 
   */
  public getStatusOfReward(rewardId: string): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getRewardStatus(token, rewardId).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getStatusOfReward: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get legs start end positions
   * @param campaignId 
   */
  public getLegsStartEnd(campaignId): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getLegsStartEnd(token,campaignId).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getLegsStartEnd: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }
}

//Location point (lat lon)
class Location {
  lon: number;
  lat: number;
  constructor(lon: number, lat: number){
    this.lon = lon;
    this.lat = lat;
  }
}

// structure
export class MotivCampaign {

  constructor(campaignId: string, isPrivate: boolean, privateCode: string, name: string, campaignDescription: string, pointsTripPurpose: number,
              pointsTransportMode: number, pointsWorth: number, pointsActivities: number, pointsAllInfo: number, country: string, city: string,
              radius: number, lon: number, lat: number, active: boolean, usersOnCampaign: string[],
              campaignManagers: string[]) {
    this.campaignId = campaignId;
    this.isPrivate = isPrivate;
    this.privateCode = privateCode;
    this.name = name;
    this.campaignDescription = campaignDescription;
    this.pointsTripPurpose = pointsTripPurpose;
    this.pointsTransportMode = pointsTransportMode;
    this.pointsWorth = pointsWorth;
    this.pointsActivities = pointsActivities;
    this.pointsAllInfo = pointsAllInfo;
    this.country = country;
    this.city = city;
    this.radius = radius;
    this.location = new Location(lon, lat);
    this.active = active;
    this.usersOnCampaign = usersOnCampaign;
    this.campaignManagers = campaignManagers;
  }
  campaignId: string;
  isPrivate: boolean;
  privateCode: string;
  name: string;
  campaignDescription: string;
  pointsTripPurpose: number;
  pointsTransportMode: number;
  pointsWorth: number;
  pointsActivities: number;
  pointsAllInfo: number;
  country: string;
  city: string;
  radius: number;
  location: Location;
  active: boolean;
  usersOnCampaign: string[];
  campaignManagers: string[];

}

class DescriptionForLanguage {
  shortDescription: string;
  longDescription: string;

  constructor(shortDescription: string, longDescription: string) {
    this.shortDescription = shortDescription;
    this.longDescription = longDescription;
  }
}


export class Reward {

  static availableTargetTypes = [
    {
      name: "Points",
      value: 1
    },
    {
      name: "Days",
      value: 2
    },
    {
      name: "Trips",
      value: 3
    },
    {
      name: "All time score",
      value: 4
    },
    {
      name: "Total days with trips for all time",
      value: 5
    },
    {
      name: "Total trips for all time",
      value: 6
    }
  ];

  rewardId: string;
  rewardName: string;
  targetCampaignId: string;
  startDate: number;
  endDate: number;
  targetType: number;
  targetValue: number;
  organizerName: string;
  linkToContact: string;
  removed: boolean;
  defaultLanguage: string;
  descriptions: Record<string, DescriptionForLanguage>;

  constructor(rewardId: string, rewardName: string, targetCampaignId: string, startDate: number, endDate: number,
    targetType: number, targetValue: number, organizerName: string, linkToContact: string, removed: boolean, 
    defaultLanguage: string, descriptions: Record<string, DescriptionForLanguage>) {

      this.rewardId = rewardId;
      this.rewardName = rewardName;
      this.targetCampaignId = targetCampaignId;
      this.startDate = startDate;
      this.endDate = endDate;
      this.targetType = targetType;
      this.targetValue = targetValue;
      this.organizerName = organizerName;
      this.linkToContact = linkToContact;
      this.removed = removed;
      this.defaultLanguage = defaultLanguage;
      this.descriptions = descriptions;
  };

  /**
   * Get available target types
   */
  public static getAvailableTargetTypes() {
    return this.availableTargetTypes;
  };

  /**
   * Get reward object to send
   */
  getRewardObjectToSend() {  // same object withoud id
    const rewardToSend = {
      "rewardName": this.rewardName,
      "targetCampaignId": this.targetCampaignId,
      "startDate": this.startDate,
      "endDate": this.endDate,
      "targetType": this.targetType,
      "targetValue": this.targetValue,
      "organizerName": this.organizerName,
      "linkToContact": this.linkToContact,
      "removed": this.removed,
      "defaultLanguage": this.defaultLanguage,
      "descriptions": this.descriptions
    };
    return rewardToSend;
  }
}