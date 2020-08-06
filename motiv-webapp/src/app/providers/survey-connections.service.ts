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
import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {AuthService} from './auth.service';
import {ServerCommunicationService} from './server-communication.service';


@Injectable({
  providedIn: 'root'
})
export class SurveyConnectionsService {

  questions: Question[];
  surveys: Survey[];
  questionTypes: QuestionTypes[];
  reportedIssuesLocal : any[];
  usersWithIssuesLocal : any[];

  availableLanguages = [
    {iso: "eng", name: "English"},
    {iso: "por", name: "Portuguese"},
    {iso: "spa", name: "Spanish"},
    {iso: "cat", name: "Catalan"},
    {iso: "fin", name: "Finnish"},
    {iso: "ger", name: "German"},
    {iso: "hrv", name: "Croatian"},
    {iso: "dut", name: "Dutch"},
    {iso: "fre", name: "French"},
    {iso: "ita", name: "Italian"},
    {iso: "nob", name: "Norwegian"},
    {iso: "slo", name: "Slovak"}
  ];

  questionTypeArray = [
    {id: 0, type: 'shortText', name: 'Short text', allowsMC: false},
    {id: 1, type: 'multipleChoice', name: 'Radio button', allowsMC: true},
    {id: 2, type: 'scale', name: 'Scale', allowsMC: false},
    {id: 3, type: 'checkboxes', name: 'Checkboxes', allowsMC: true},
    {id: 4, type: 'paragraph', name: 'Paragraph', allowsMC: false},
    {id: 5, type: 'dropdown', name: 'Dropdown', allowsMC: true},
    {id: 6, type: 'yesNo', name: 'Yes/No', allowsMC: false}

  ];

  surveyTypeArray = [
    {id: 0, type: 'open', name: 'Open', roles: ['Admin']},
    {id: 1, type: 'closed', name: 'Closed', roles: ['Admin', 'CM' ]},
    {id: 2, type: 'intermediate', name: 'Intermediate', roles: ['Admin']}
  ];

  triggerTypeArray = [
    {id: 0, type: 'once', name: 'To trigger once on date'},
    {id: 1, type: 'repeatable', name: 'Repeatable'},
    {id: 2, type: 'event', name: 'Event'}
  ];

  constructor(private http: HttpClient,
              private authService: AuthService,
              private serverCommunicationService: ServerCommunicationService) { }

  /**
   * Get language iso by language name
   * 
   * @param language 
   * @returns language iso
   */
  public getIsoByLanguageName (language: string){
    var iso = '';
    this.availableLanguages.forEach( (element) => {
      if (element.name === language){
        iso = element.iso;
      }
    });
    return iso;
  }

  /**
   * Get language name by language iso
   * 
   * @param iso 
   * @returns language name
   */
  public getLanguageNameByIso (iso: string){
    var lang = '';
    this.availableLanguages.forEach( (element) => {
      if (element.iso === iso){
        lang = element.name;
      }
    });
    return lang;
  }

  /**
   * Gets questions from server
   */
  public getQuestionsFromServer(): void {
    console.log( '--- GetQuestions ');

    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.getQuestions(token).subscribe(resp => {
      const keys = resp.headers.keys();
      const headers = keys.map(key =>
        `${key}: ${resp.headers.get(key)}`);
      this.questions = Array.from(resp.body);
      });
    });
  }

  /**
   * Gets the questiosn
   * @returns questions
   */
  public getQuestions(): Question[] {
    return this.questions;
  }

  /**
   * Get question type name
   * 
   * @param questionType 
   * @returns name
   */
  getQuestionTypeName(questionType: string) {
    return this.questionTypeArray.find(a => a.type === questionType).name;
  }

  /**
   * Get survey type name
   * 
   * @param surveyType 
   * @returns name
   */
  getSurveyTypeName(surveyType: string) {
    return this.surveyTypeArray.find(a => a.type === surveyType).name;
  }

  /**
   * Get survey type by roles
   */
  getSurveyTypeByRoles() {
    if(this.authService.checkRole('Admin')) {
      return this.surveyTypeArray;
    } else if(this.authService.checkRole('CM')) {
      return this.surveyTypeArray.filter(type => type.roles.includes('CM'));
    }
    return [];
  }

  /**
   * Get survey type by id
   * 
   * @param id 
   * @return type
   */
  getSurveyIdType(id: Number) {
    return this.surveyTypeArray.find(a => a.id === id).type;
  }

  /**
   * Get trigger type name
   * 
   * @param triggerType 
   * @returns trigger name
   */
  getTriggerTypeName(triggerType: string) {
    return this.triggerTypeArray.find(a => a.type === triggerType).name;
  }

  /**
   * Get trigger type based on id
   * 
   * @param id 
   * @return type
   */
  getTriggerIdType(id: Number) {
    console.log('id: ' + id);
    return this.triggerTypeArray.find(a => a.id === id).type;
  }

  /**
   * Creates a new question
   * 
   * @param question 
   * @param language 
   * @param answers 
   * @param questionType 
   * @param logfunc 
   * @param addTranslation 
   */
  public newQuestion(question: string, language: string, answers: string[], questionType: string , logfunc: (resp, addTranslation, questionId) => void, addTranslation: boolean): void {
    var languageIso = this.getIsoByLanguageName(language);
    const questionObj = {
      'question': {[languageIso]: question},
      'answers': {[languageIso]: answers},
      'questionType': questionType,
      'languageOfCreation': [languageIso]
    };

    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.addQuestion(token, questionObj).subscribe(resp => {
      const keys = resp.headers.keys();
      const headers = keys.map(key =>
        `${key}: ${resp.headers.get(key)}`);

      new Promise ( (resolve, reject) => {
        this.getQuestionsFromServer();
        resolve("end");
      }).then(() => {
        logfunc(resp, addTranslation, resp.body.questionId)
      });
      });
    });
  }

  /**
   * Edits question
   * 
   * @param question 
   * @param callback 
   */
  public editQuestion(question: Question, callback: any): void {
    
    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.editQuestion(token, question).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        console.log(headers);
        this.getQuestionsFromServer();
        callback("");
      });
    });
  }

  /**
   * Deletes question
   * 
   * @param question 
   */
  public deleteQuestion(question: Question): void {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.deleteQuestion(token, question.questionId).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        console.log(headers);
        this.getQuestionsFromServer();
        });
      });
  }

  /**
   * Get question types from server
   */
  public getQuestionTypesFromServer(): void {
    console.log( '--- getQuestionTypes ');

    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.getQuestionTypes(token).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        this.questionTypes = Array.from(resp.body);
        console.log( 'questions: ' + this.questionTypes.length);
        console.log( 'questions: ' + typeof(this.questionTypes));
      });
    });
  }

  /**
   * Get question types
   */
  public getQuestionTypes(): QuestionTypes[] {
    return this.questionTypes;
  }

  /**
   * Get surveys from server
   */
  public getSurveysFromServer(): void {
    console.log( '--- GetSurveys ');
    this.surveys = undefined;

    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.getSurveys(token).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        this.surveys = Array.from(resp.body);
        console.log( 'questions: ' + this.surveys.length);
        console.log( 'questions: ' + typeof(this.surveys));
      });
    });
  }

  /**
   * Get surveys
   */
  public getSurveys(): Survey[] {
    return this.surveys;
  }

  /**
   * Get local survey by id
   * 
   * @param surveyid 
   * @returns survey
   */
  public getLocalSurveyById(surveyid: number): Survey{
    if (this.surveys){
      return this.surveys.find( (s) =>{
        return s.surveyID === surveyid;
      });
    } else {
      return undefined;
    }
  }

  /**
   * Create new survey
   * 
   * @param survey 
   * @param logfunc 
   */
  public newSurvey(survey: Survey, logfunc: (resp) => void): void {
    const sendSurvey: any = survey;
    const questions = sendSurvey.questions;
    sendSurvey.questions = [];

    for (const question of questions) {
      sendSurvey.questions.push(question.questionId);
    }

    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.addSurvey(token, sendSurvey).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        this.getSurveysFromServer();
        logfunc(resp);
      });
    });
  }

  /**
   * Edit survey
   * 
   * @param survey 
   * @param logfunc 
   */
  public editSurvey(survey: Survey, logfunc: (resp) => void): void {
    const sendSurvey: any = survey;
    const questions = sendSurvey.questions;
    sendSurvey.questions = [];

    for (const question of questions) {
      sendSurvey.questions.push(question.questionId);
    }

    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.editSurvey(token, sendSurvey).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        this.getSurveysFromServer();
        logfunc(resp);
      });
    });
  }

  /**
   * Launch survey
   * 
   * @param launch
   * @param surveyID 
   * @param responseHandler 
   */
  public launchSurvey(launch: Launch, surveyID: number, responseHandler: (resp) => void): void {
    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.launchSurvey(token, surveyID, launch).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        console.log(headers);
        responseHandler(resp);
      });
    });
  }

  /**
   * Validate Survey name
   * 
   * @param surveyName 
   */
  public validateSurveyName(surveyName): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.surveyNameValidation(token, surveyName).subscribe( (response) => {
          if (response.status === 202){
            console.log("validateSurveyName: : ", response.body); 
            reject(response.body);
            return;
          }
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("validateSurveyName: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Delete survey
   * 
   * @param survey 
   */
  public deleteSurvey(survey): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.deleteSurvey(token, survey.surveyID).subscribe( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("deleteSurvey: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }


  /**
   * Get number of answers by survey id
   * 
   * @param surveyid 
   */
  public getNumberOfAnswersOfSurvey(surveyid): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getNumberOfAnswersBySurveyid(token, surveyid).subscribe( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getNumberOfAnswersOfSurvey: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get event types
   * 
   * @param logfunc 
   */
  public getEventTypes(logfunc: (resp) => void): void {
    console.log( '--- getEventTypes ');

    this.authService.getToken().then( (token) => {  

      this.serverCommunicationService.getEventTypes(token).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);

        const eventTypes = Array.from(resp.body);

        console.log( 'questions: ' + this.questions.length);
        console.log( 'questions: ' + typeof(this.questions));

        logfunc(eventTypes);
      });

    });
  }


  /**
   * Export answers of survey
   * 
   * @param surveyID 
   */
  public exportAnswersOfSurvey(surveyID): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.exportSurveyAnswers(token, surveyID).subscribe( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("exportAnswersOfSurvey: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }


  /**
   * Get reporting answers from server
   * 
   * @param leftLimitTs 
   * @param rightLimitTs 
   */
  public getReportingAnswersFromServer(leftLimitTs: number, rightLimitTs: number) : Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getReportingAnswers(token, leftLimitTs, rightLimitTs).subscribe( (response) => {
          if (response.status === 200){
            this.reportedIssuesLocal = response.body.reports;
            this.usersWithIssuesLocal = response.body.users;
            resolve(response.body);
          } else{
            console.log("getReportingAnswersFromServer: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }


  /**
   * Get reporting surveys
   */
  public getReportingSurvey() : Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getReportingSurvey(token).subscribe( (response) => {
          if (response.status === 200){
            resolve(response.body.surveys[0]);
          } else{
            console.log("getReportingSurvey: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Send reporting answers
   * 
   * @param report 
   */
  public sendReportingAnswers(report) : Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.addReportingSurveyAnswers(token, report).subscribe( (response) => {
          if (response.status === 200){
            resolve(response);
          } else{
            console.log("sendReportingAnswers: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Download image by name
   * 
   * @param filename 
   */
  public downloadImageByName(filename) : Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getImageByName(token, filename).subscribe( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("downloadImageByName: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Get answers by report id
   * 
   * @param reportId 
   */
  public getAnswersByReportId(reportId: string): any{
    var report;
    
    this.reportedIssuesLocal.forEach( elem => {
      if (elem._id === reportId) {
        report = elem;
      }
    });
    var user = this.usersWithIssuesLocal.find(elem => {
      return elem.userid === report.uid;
    });
    return {"report": report, "user": user};
  }

  /**
   * Get questions by ids
   * 
   * @param questionIds 
   */
  public getQuestionsByIds(questionIds): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getQuestionsByIds(token, questionIds).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getQuestionsByIds: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Update reporting
   * 
   * @param newReporting 
   */
  public updateReporting(newReporting): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.updateReportingAnswers(token, newReporting).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("updateReporting: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Update user list in surveys by target campaigns
   */
  public updateUserListInSurveysByTargetCampaigns(): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.updateUsersOfSurveysByTargetCampaigns(token).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("updateUserListInSurveysByTargetCampaigns: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }


}

// Question Object
export class Question {
  question: any[];
  answers: any[];
  questionId: string;
  questionType: string;
  deleted: boolean;
  languageOfCreation: string;
}

// Triggers
export interface Trigger {
  triggerType(): string;
}

export class TimedTrigger implements Trigger {
  timestamp: number;
  type: string;

  constructor(timestamp: number) {
    this.timestamp = timestamp;
    this.type = 'timedTrigger';
  }

  triggerType(): string {
    return 'TimedTrigger';
  }
}

export class EventTrigger implements Trigger {
  trigger: string;
  type: string;

  constructor(trigger: string) {
    this.trigger = trigger;
    this.type = 'eventTrigger';
  }

  triggerType(): string {
    return 'EventTrigger';
  }
}

export class TimedRecurringTrigger implements Trigger {
  startday: number;
  timeInBetween: number;
  type: string;

  constructor(startday: number, timeInBetween: number) {
    this.startday = startday;
    this.timeInBetween = timeInBetween;
    this.type = 'timedRecurringTrigger';
  }

  triggerType(): string {
    return 'TimedRecurringTrigger';
  }
}


// Launch
export class Launch {
  users: string[];
  launchID: string;
  launchDate: number;
  ageMin: number;
  ageMax: number;
  campaignIDs: string[];


  constructor(users: string[], launchID: string, launchDate: number, ageMin: number, ageMax: number, campaignIDs: string[]) {
    this.users = users;
    this.launchID = launchID;
    this.launchDate = launchDate;
    this.ageMin = ageMin;
    this.ageMax = ageMax;
    this.campaignIDs = campaignIDs


  }
}

// Survey
export class Survey {
  surveyID: number;
  defaultLanguage: string;
  surveyName: string;
  description: string;
  estimatedDuration: number;
  surveyPoints: number;
  version: number;
  globalSurveyTimestamp: number;
  startDate: number;
  stopDate: number;
  deleted: boolean;
  urgent: boolean;
  surveyType: string;
  campaigns: Number[];
  trigger: Trigger;
  launch: Launch;
  questions: Question[];
  edited: boolean;

  constructor(surveyID: number,
              surveyName: string,
              description: string,
              estimatedDuration : number,
              surveyPoints: number,
              defaultLanguage: string,
              version: number,
              globalSurveyTimestamp: number,
              startDate: number,
              stopDate: number,
              deleted: boolean,
              urgent: boolean,
              surveyType: string,
              campaigns: Number[],
              trigger: Trigger,
              launch: Launch,
              questions: Question[],
              edited: boolean) {

    this.surveyID = surveyID;
    this.defaultLanguage = defaultLanguage;
    this.surveyName = surveyName;
    this.description = description;
    this.estimatedDuration = estimatedDuration;
    this.surveyPoints = surveyPoints;
    this.version = version;
    this.globalSurveyTimestamp = globalSurveyTimestamp;
    this.startDate = startDate;
    this.stopDate = stopDate;
    this.deleted = deleted;
    this.urgent = urgent;
    this.surveyType = surveyType;
    this.campaigns = campaigns;
    this.trigger = trigger;
    this.launch = launch;
    this.questions = questions;
    this.edited = edited;
  }
}

// questionTypes
export class QuestionTypes {
  id: Number;
}
