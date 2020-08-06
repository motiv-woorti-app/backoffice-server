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
import { Observable } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpResponse, HttpHeaders } from '@angular/common/http';
import {Response} from '@angular/http';
import { Injectable } from '@angular/core';

import { of } from 'rxjs/observable/of';
import { catchError, map, tap, retry } from 'rxjs/operators';
import {throwError} from 'rxjs/index';
import {Question} from './survey-connections.service';
import { Reward } from './campaign.service';

@Injectable()
export class ServerCommunicationService {

//api_url = 'https://app.motiv.gsd.inesc-id.pt:8000';  // on server
api_url = 'http://localhost:8000';                      // local tests

  constructor(
    private http: HttpClient
  ) { }

  /**
   * Generate Header
   * 
   * @param token 
   */
  private generateHeader(token): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': 'Bearer ' + token
    });
  }

  /**
   * Get csv
   */
  getCsv(): Observable<any> {
    const csvUrl = `${this.api_url}/util/csv`;
    return this.http.get<any>(csvUrl, {observe: 'response'}).pipe(catchError(this.handleError));
  }

  /**
   * Get trip points
   * 
   * @param tripId 
   */
  getPointsCsv(tripId): Observable<any> {
    const pointsUrl = `${this.api_url}/util/points/${tripId}`;
    return this.http.get<any>(pointsUrl, {observe: 'response'}).pipe(catchError(this.handleError));
  }

  /**
   * Get raw data
   * 
   * @param partNumber 
   */
  getRawData(partNumber) : Observable<any> {
    let rawDataUrl = `${this.api_url}/util/rawdata/${partNumber}`;
    return this.http.get<any>(rawDataUrl, {observe: 'response'}).pipe(catchError(this.handleError));
  }

  /**
   * Get user roles
   * 
   * @param userid 
   * @param token 
   */
  getRoles(userid, token): Observable<any> {
    const getRolesUrl = `${this.api_url}/api/users/${userid}/roles`;

    return this.http.get<any>(
      getRolesUrl,
      {observe: 'response',
        headers : this.generateHeader(token)}
    ).pipe(catchError(this.handleError));
  }

// Survey-related communications:

/**
 * Get questions
 * 
 * @param token 
 */
  getQuestions(token): Observable<any> {
    let getQuestionsUrl = `${this.api_url}/backoffice/survey/questions`;
    return this.http.get<Question[]>(getQuestionsUrl, {observe: 'response', headers : this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Add question
   * 
   * @param token 
   * @param question 
   */
  addQuestion(token, question): Observable<any> {
    let addQuestionUrl = `${this.api_url}/backoffice/survey/questions`;
    return this.http.post(addQuestionUrl, question, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Edit question
   * 
   * @param token 
   * @param question 
   */
  editQuestion(token, question): Observable<any> {
    let editQuestionUrl = `${this.api_url}/backoffice/survey/questions/${question.questionId}`;
    return this.http.put(editQuestionUrl, question, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Delete question
   * 
   * @param token 
   * @param questionId 
   */
  deleteQuestion(token, questionId): Observable<any> {
    let deleteQuestionUrl = `${this.api_url}/backoffice/survey/questions/${questionId}`;
    return this.http.delete(deleteQuestionUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get question types
   * 
   * @param token 
   */
  getQuestionTypes(token): Observable<any> {
    let getQuestionTypesUrl = `${this.api_url}/backoffice/survey/questionTypes`;
    return this.http.get(getQuestionTypesUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get surveys
   * 
   * @param token 
   */
  getSurveys(token): Observable<any> {
    let getSurveysUrl = `${this.api_url}/backoffice/surveys`;
    return this.http.get(getSurveysUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Add survey
   * 
   * @param token 
   * @param survey 
   */
  addSurvey(token, survey): Observable<any> {
    let addSurveyUrl = `${this.api_url}/backoffice/surveys`;
    return this.http.post(addSurveyUrl, survey, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Edit survey
   * 
   * @param token 
   * @param survey 
   */
  editSurvey(token, survey): Observable<any> {
    let editSurveyUrl = `${this.api_url}/backoffice/surveys/${survey.surveyID}`;
    return this.http.put(editSurveyUrl, survey, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Launch survey
   * 
   * @param token 
   * @param surveyId 
   * @param launch 
   */
  launchSurvey(token, surveyId, launch): Observable<any> {
    let launchSurveyUrl = `${this.api_url}/backoffice/surveys/launch/${surveyId}`;
    return this.http.put(launchSurveyUrl, launch, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Delete survey
   * 
   * @param token 
   * @param surveyId 
   */
  deleteSurvey(token, surveyId): Observable<any> {
    let deleteSurveyUrl = `${this.api_url}/backoffice/surveys/remove/${surveyId}`;
    return this.http.delete(deleteSurveyUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get event types
   * 
   * @param token 
   */
  getEventTypes(token): Observable<any> {
    let getEventTypesUrl = `${this.api_url}/backoffice/survey/eventTypes`;
    return this.http.get(getEventTypesUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
  }

  // Campaign-related communications:

  /**
   * Get managed campaigns
   * 
   * @param token 
   */
  getManagedCampaigns(token): Observable<any> {
    let getManagedCampaignsUrl = `${this.api_url}/backoffice/campaigns/managed`;
    return this.http.get(getManagedCampaignsUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
  }

  /**
   * Add campaign
   * 
   * @param token 
   * @param campaign 
   */
  addCampaign(token, campaign): Observable<any> {
    let addCampaignUrl = `${this.api_url}/backoffice/campaign`;
    return this.http.post(addCampaignUrl, campaign, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
  }

  /**
   * Edit campaign
   * 
   * @param token 
   * @param campaign 
   */
  editCampaign(token, campaign): Observable<any> {
    let editCampaignUrl = `${this.api_url}/backoffice/campaign`;
    return this.http.put(editCampaignUrl, campaign, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
  }

  /**
   * Validate campaign private code
   * 
   * @param token 
   * @param privateCode 
   */
  validateCampaignPrivateCode(token, privateCode): Observable<any> {
    let validateCampaignPrivateCodeUrl = `${this.api_url}/backoffice/campaign/codecheck/${privateCode}`;
    return this.http.get(validateCampaignPrivateCodeUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get global statistics
   * 
   * @param token 
   * @param leftLimitTs 
   * @param rightLimitTs 
   * @param campaignID 
   */
  getGlobalStatistics(token, leftLimitTs: number, rightLimitTs: number, campaignID: string): Observable<any> {
    let getGlobalStatisticsUrl = `${this.api_url}/util/statistics`;
    let prms = {"leftLimitTs": JSON.stringify(leftLimitTs),
                "rightLimitTs": JSON.stringify(rightLimitTs),
                "campaignid": JSON.stringify(campaignID)};
    return this.http.get(getGlobalStatisticsUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get total trips without duplicates
   * 
   * @param token 
   */
  getTotalTripsWithoutDuplicates(token): Observable<any> {
    let getGlobalStatisticsUrl = `${this.api_url}/util/TripsCountWithoutDuplicates`;
    return this.http.get(getGlobalStatisticsUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get reporting answers
   * 
   * @param token 
   * @param leftLimitTs 
   * @param rightLimitTs 
   */
  getReportingAnswers(token, leftLimitTs: number, rightLimitTs: number): Observable<any> {
    let getReportingAnswersUrl = `${this.api_url}/backoffice/surveys/reportingAnswers`;
    let prms = {"leftLimitTs": JSON.stringify(leftLimitTs),
                "rightLimitTs": JSON.stringify(rightLimitTs)};
    return this.http.get(getReportingAnswersUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get questions by ids
   * 
   * @param token 
   * @param questIds 
   */
  getQuestionsByIds(token: String, questIds): Observable<any> {
    let getQuestionsByIdsUrl = `${this.api_url}/backoffice/surveys/questionsByIds`;
    let prms = {"ids": JSON.stringify(questIds)};
    return this.http.get(getQuestionsByIdsUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Update reporting answers
   * 
   * @param token 
   * @param updatedReporting 
   */
  updateReportingAnswers(token, updatedReporting) : Observable<any> {
    let updateReportingAnswersUrl = `${this.api_url}/backoffice/surveys/reporting/${updatedReporting._id}`;
    return this.http.put(updateReportingAnswersUrl, updatedReporting, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError)); 
  }

  /**
   * Get statistics of trips
   * 
   * @param token 
   * @param leftLimitTs 
   * @param rightLimitTs 
   */
  getStatisticsOfTrips(token: String, leftLimitTs: number, rightLimitTs: number): Observable<any> {
    let getStatisticsOfTripsUrl = `${this.api_url}/backoffice/trips/summary`;
    let prms = {"leftLimitTs": JSON.stringify(leftLimitTs),
                "rightLimitTs": JSON.stringify(rightLimitTs)};
    return this.http.get(getStatisticsOfTripsUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get info of trip
   * 
   * @param token 
   * @param tripid 
   */
  getInfoOfTrip(token, tripid: String): Observable<any> {
    let getInfoOfTripUrl = `${this.api_url}/backoffice/trips/summary/${tripid}`;
    return this.http.get(getInfoOfTripUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get reporting survey
   * 
   * @param token 
   */
  getReportingSurvey(token): Observable<any> {
    let getReportingSurveyUrl = `${this.api_url}/api/surveys/reportingSurvey`;
    return this.http.get(getReportingSurveyUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Add reporting survey answers
   * 
   * @param token 
   * @param report 
   */
  addReportingSurveyAnswers(token, report): Observable<any> {
    let addReportingSurveyAnswersUrl = `${this.api_url}/backoffice/surveys/reportingwithfile`;  
    var customHeaders = new HttpHeaders({ 
      'Authorization': 'Bearer ' + token
    });
    return this.http.post(addReportingSurveyAnswersUrl, report, {observe: 'response', headers: customHeaders}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get image by name
   * 
   * @param token 
   * @param filename 
   */
  getImageByName(token, filename): Observable<any> {
    let getImageByNameUrl = `${this.api_url}/backoffice/surveys/reporting/reportimage/${filename}`;
    return this.http.get(getImageByNameUrl, {observe: 'response', responseType: "blob", headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get campaign users
   * 
   * @param token 
   * @param campaignid 
   */
  getCampaignsUsers(token, campaignid) : Observable<any> {
    let getCampaignsUsersUrl = `${this.api_url}/backoffice/campaign/users/${campaignid}`;
    return this.http.get(getCampaignsUsersUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get campaign users and answers
   * 
   * @param token 
   * @param campaignid 
   */
  getCampaignsUsersAndAnswers(token, campaignid) : Observable<any> {
    let getCampaignsUsersUrl = `${this.api_url}/backoffice/campaigns/statistics/answers/${campaignid}`;
    return this.http.get(getCampaignsUsersUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Add user to campaign
   * 
   * @param token 
   * @param emailOfUSerToAdd 
   * @param campaignId 
   */
  addUserToCampaign(token, emailOfUSerToAdd, campaignId): Observable<any> {
    let addUserToCampaignUrl = `${this.api_url}/backoffice/campaign/addnewuser`;
    var objectToSend = {
      campaignId : campaignId,
      emailOfUser : emailOfUSerToAdd
    };
    return this.http.put(addUserToCampaignUrl, objectToSend, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError)); 
  }

  /**
   * Exclude user from campaign
   * 
   * @param token 
   * @param emailOfUSerToExclude 
   * @param campaignId 
   */
  excludeUserFromCampaign(token, emailOfUSerToExclude, campaignId): Observable<any> {
    let excludeUserFromCampaignUrl = `${this.api_url}/backoffice/campaign/excludeuser`;
    var objectToSend = {
      campaignId : campaignId,
      emailOfUser : emailOfUSerToExclude
    };
    return this.http.put(excludeUserFromCampaignUrl, objectToSend, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError)); 
  }

  /**
   * Add users to campaign
   * 
   * @param token 
   * @param emailsOfUSerToAdd 
   * @param campaignId 
   */
  addUsersToCampaign(token, emailsOfUSerToAdd: string[], campaignId: string): Observable<any> {
    let addUsersToCampaignUrl = `${this.api_url}/backoffice/campaign/addmultipleusers`;
    var objectToSend = {
      campaignId : campaignId,
      emailsOfUsers : emailsOfUSerToAdd
    };
    return this.http.put(addUsersToCampaignUrl, objectToSend, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError)); 
  }

  /**
   * Export campaign trip data
   * 
   * @param token 
   * @param campaignId 
   */
  exportCampaignTripData(token, campaignId): Observable<any> {
    let exportCampaignTripDataUrl = `${this.api_url}/backoffice/tripdata`;
    let prms = {"campaignid": JSON.stringify(campaignId)};
    return this.http.get(exportCampaignTripDataUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Export campaign user data
   * 
   * @param token 
   * @param campaignId 
   */
  exportCampaignUserData(token, campaignId): Observable<any> {
    let exportCampaignUserDataUrl = `${this.api_url}/backoffice/userdata`;
    let prms = {"campaignid": JSON.stringify(campaignId)};
    return this.http.get(exportCampaignUserDataUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * export campaign trips and users data
   * 
   * @param token 
   * @param campaignId 
   */
  exportCampaignTripsAndUsersData(token, campaignId): Observable<any> {
    let exportCampaignTripsAndUsersDataUrl = `${this.api_url}/backoffice/tripsofusersdata`;
    let prms = {"campaignid": JSON.stringify(campaignId)};
    return this.http.get(exportCampaignTripsAndUsersDataUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * get trips for mode statistics
   * 
   * @param token 
   * @param campaignId 
   */
  getTripsForModeStatistics(token, campaignId: string): Observable<any> {
    let getTripsForModeStatisticsUrl = `${this.api_url}/backoffice/trips/campaign/modeStatistics`;
    let prms = {"campaignid": JSON.stringify(campaignId)};
    return this.http.get(getTripsForModeStatisticsUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get statistics by campaign id
   * 
   * @param token 
   * @param leftLimitTs 
   * @param rightLimitTs 
   * @param campaignId 
   */
  getStatisticsByCampaignid(token, leftLimitTs: number, rightLimitTs: number, campaignId: string): Observable<any> {
    let getStatisticsByCampaignUrl = `${this.api_url}/backoffice/trips/campaign/summary`;
    let prms = {"leftLimitTs": JSON.stringify(leftLimitTs),
                "rightLimitTs": JSON.stringify(rightLimitTs),
                "campaignid": JSON.stringify(campaignId)};
    return this.http.get(getStatisticsByCampaignUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Export survey answers
   * 
   * @param token 
   * @param surveyId 
   */
  exportSurveyAnswers(token, surveyId): Observable<any> {
    let exportSurveyAnswersUrl = `${this.api_url}/backoffice/surveys/answer/${surveyId}`;
    return this.http.get(exportSurveyAnswersUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Update users of survey by target campaign
   * 
   * @param token 
   */
  updateUsersOfSurveysByTargetCampaigns(token): Observable<any> {
    let updateUsersOfSurveysByTargetCampaignsUrl = `${this.api_url}/backoffice/surveys/updateusers`;
    return this.http.get(updateUsersOfSurveysByTargetCampaignsUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get campaigns by ids
   * 
   * @param token 
   * @param campaignIds 
   */
  getCampaignsByIds(token, campaignIds) : Observable<any> {
    let getCampaignsByIdsUrl = `${this.api_url}/backoffice/campaigns/ids`;
    let prms = {"campaignIds": JSON.stringify(campaignIds)};
    return this.http.get(getCampaignsByIdsUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get users by ids
   * 
   * @param token 
   * @param usersIds 
   */
  getUsersByIds(token, usersIds) : Observable<any> {
    let getUsersByIdsUrl = `${this.api_url}/backoffice/users/ids`;
    let prms = {"usersIds": JSON.stringify(usersIds)};
    return this.http.get(getUsersByIdsUrl, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }
 
  /**
   * Get number of answers by survey id
   * 
   * @param token 
   * @param surveyid 
   */
  getNumberOfAnswersBySurveyid(token, surveyid): Observable<any> {
    let exportSurveyAnswersUrl = `${this.api_url}/backoffice/surveys/answers/number/${surveyid}`;
    return this.http.get(exportSurveyAnswersUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Survey name validation
   * 
   * @param token 
   * @param surveyName 
   */
  surveyNameValidation(token, surveyName): Observable<any> {
    let surveyNameValidationUrl = `${this.api_url}/backoffice/surveys/validation/${surveyName}`;
    return this.http.get(surveyNameValidationUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Add reward
   * 
   * @param token 
   * @param reward 
   */
  addReward(token, reward: Reward): Observable<any> {
    const rewardObjectToSend = reward.getRewardObjectToSend();
    let addRewardUrl = `${this.api_url}/backoffice/rewards`;
    return this.http.post(addRewardUrl, rewardObjectToSend, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
  }

  /**
   * Get campaign ids of active rewards
   * 
   * @param token 
   */
  getCampaignIdsOfActiveRewards(token): Observable<any> {
    let getCampaignsWithActiveRewardUrl = `${this.api_url}/backoffice/rewards/active/campaigns`;
    return this.http.get(getCampaignsWithActiveRewardUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get existing rewards
   * 
   * @param token 
   */
  getExistingRewards(token): Observable<any> {
    let getExistingRewardsUrl = `${this.api_url}/backoffice/rewards`;
    return this.http.get(getExistingRewardsUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Get reward id
   * 
   * @param token 
   * @param rewardId 
   */
  getRewardById(token, rewardId: string): Observable<any> {
    let getRewardByIdUrl = `${this.api_url}/backoffice/rewards/${rewardId}`;
    return this.http.get(getRewardByIdUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

  /**
   * Edit reward
   * 
   * @param token 
   * @param reward 
   */
  editReward(token, reward: Reward): Observable<any> {
    const rewardObjectToSend = reward.getRewardObjectToSend();
    let editRewardUrl = `${this.api_url}/backoffice/rewards/${reward.rewardId}`;
    return this.http.put(editRewardUrl, rewardObjectToSend, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
  }

  /**
   * Get reward status
   * 
   * @param token 
   * @param rewardId 
   */
  getRewardStatus(token, rewardId: string): Observable<any> {
    let getRewardStatusUrl = `${this.api_url}/backoffice/rewards/status/${rewardId}`;
    return this.http.get(getRewardStatusUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));
  }

   // User management related communications:
/**
 * Edit roles
 * 
 * @param token 
 * @param user 
 */
editRoles(token, user): Observable<any> {
  let editRolesUrl = `${this.api_url}/backoffice/users/${user.userid}`;
  return this.http.put(editRolesUrl, user.roles, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
}

/**
 * Get users
 * 
 * @param token 
 */
getUsers(token): Observable<any> {
  let getUsersUrl = `${this.api_url}/backoffice/users`;
  return this.http.get(getUsersUrl, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
}

/**
 * Get trip digests
 * 
 * @param token 
 */
getTripDigests(token): Observable<any> {
  let getTripDigests = `${this.api_url}/backoffice/tripDigests`;
  return this.http.get(getTripDigests, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
}

/**
 * Get legal files
 * 
 * @param token 
 */
getLegalFiles(token):Observable<any> {
  let getLegalFiles = `${this.api_url}/backoffice/legalfiles`;
  return this.http.get(getLegalFiles, {observe: 'response', headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
}

/**
 * Get legs start end
 * 
 * @param token 
 * @param campaignId 
 */
getLegsStartEnd(token,campaignId): Observable<any> {
  let getLegsStartEnd = `${this.api_url}/backoffice/trips/legsStartEnd`;
  let prms = {"campaignid": JSON.stringify(campaignId)};
  return this.http.get(getLegsStartEnd, {observe: 'response', params: prms, headers: this.generateHeader(token)}).pipe(retry(3), catchError(this.handleError));  
}
  // error handling
  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${JSON.stringify(error)}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
}
}