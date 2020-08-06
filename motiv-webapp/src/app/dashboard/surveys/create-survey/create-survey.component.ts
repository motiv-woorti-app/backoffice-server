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
import { Component, OnInit , ViewChild } from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {
  EventTrigger,
  Launch,
  Question,
  Survey,
  SurveyConnectionsService,
  TimedRecurringTrigger,
  TimedTrigger,
  Trigger
} from '../../../providers/survey-connections.service';
import { MatTableDataSource, MatTable } from '@angular/material';

import { Location} from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import * as moment from 'moment';

@Component({
  selector: 'app-create-survey',
  templateUrl: `./create-survey.component.html`,
  styleUrls: ['./create-survey.component.css']
})

export class CreateSurveyComponent implements OnInit {

  urgent = false;
  surveyId = 0;
  defaultLanguage : string;
  allLanguages : string[];
  surveyName = "";
  description = "";
  estimatedDuration = "2";
  surveyPoints = "100";
  surveyVersion = 0;
  globalSurveyTimestamp = 0;
  deleted = false;
  selectedCampaigns = [];
  edited = false;

  surveyTypes;
  selectedSurveyType = 'closed';

  triggerTypes;
  selectedTriggerType;

  startDate;
  endDate;

  questions;

  triggerDate;
  startFrequency;
  eventText;
  eventType;

  columnsToShow = ['id', 'question', 'type', 'actionsColumn'];

  chosenSurveyQuestions = [];

  editingSurvey : boolean;
  duplicatingSurvey : boolean;

  surveyNameErrorMessage = undefined;
  surveyNameIsValid = false;
  submitButtonName : string;
  fixForNumOfQuestions = undefined;

  @ViewChild('table') table: MatTable<any>;

  constructor(
    private surveyConnModule: SurveyConnectionsService,
    private location: Location,
    private route: ActivatedRoute
  ) { }


  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      var surveyToEdit = params["surveyToEdit"];
      var surveyToDuplicate = params["surveyToDuplicate"];
      
      var survey;
      if (surveyToEdit !== undefined){
        this.editingSurvey = true;
        this.submitButtonName = "Edit survey";
        survey = JSON.parse(surveyToEdit);
      } 
      if (surveyToDuplicate !== undefined) {
        this.duplicatingSurvey = true;
        this.submitButtonName = "Duplicate survey";
        survey = JSON.parse(surveyToDuplicate);
      }
      if (surveyToEdit === undefined && surveyToDuplicate === undefined){
        this.editingSurvey = false;
        this.duplicatingSurvey = false;
        this.submitButtonName = "Create survey";
      }
      this.initSurveyData(survey);
    });

  }

  /**
   * Initialize survey data
   * 
   * @param survey 
   */
  private initSurveyData (survey){

    this.surveyTypes = this.surveyConnModule.getSurveyTypeByRoles();
    this.triggerTypes = [         // temp triggers:
      {id: 0, type: 'once', name: 'To trigger once on date'},
      {id: 2, type: 'event', name: 'Event'}
    ];
    this.surveyConnModule.getQuestionsFromServer();
    this.eventType = [    // temp trigger types
      {
        _id: "5b1f8a3708f30eb41d33f734",
        id: 0,
        name: "Start trip",
        type: "starttrip"
      }
    ];

    var languages = [];
    this.surveyConnModule.availableLanguages.forEach(element => {
      languages.push(element.name);
    });
    this.allLanguages = languages;
    
    if (this.editingSurvey || this.duplicatingSurvey){
      if (this.editingSurvey){
        this.surveyId = survey.surveyID;
        this.edited = true;
      }
      this.surveyName = survey.surveyName;
      this.description = survey.description;
      this.estimatedDuration = survey.estimatedDuration;
      this.surveyPoints = survey.surveyPoints;
      this.defaultLanguage = this.surveyConnModule.getLanguageNameByIso(survey.defaultLanguage);
      this.surveyVersion = survey.version;
      this.globalSurveyTimestamp = survey.globalSurveyTimestamp;
      this.startDate = moment(survey.startDate);
      this.endDate = moment(survey.stopDate);
      if(this.duplicatingSurvey){
        this.deleted = false;
      }
      else{
        this.deleted = survey.deleted;
      }
      this.urgent = survey.urgent;
      this.selectedSurveyType = survey.surveyType;
      this.selectedCampaigns = survey.campaigns;

      var surveyTriggerType = survey.trigger.type;
      if (surveyTriggerType === "timedTrigger"){
        this.selectedTriggerType = 0;
        this.triggerDate = moment(survey.trigger.timestamp);
      } else if (surveyTriggerType === "eventTrigger"){
        this.selectedTriggerType = 2;
        this.eventText = survey.trigger;
      } else if (surveyTriggerType === "timedRecurringTrigger") {
        this.selectedTriggerType = 1;
        console.log("Trigger time : ", survey.trigger.startday);
        this.triggerDate = moment(survey.trigger.startday);
        console.log("Trigger DATE : ", this.triggerDate);
        this.startFrequency = survey.trigger.timeInBetween;
      }

      survey.questions.forEach(element => {
        this.chosenSurveyQuestions.push(element);
      });

      this.fixForNumOfQuestions = undefined;
      if (this.chosenSurveyQuestions.length !== 0) {
        this.fixForNumOfQuestions =this.chosenSurveyQuestions.length;
      }
      
    } else {
      this.defaultLanguage = languages[0]; // first language (english)
    }
    
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Disable survey name edit
   */
  disableSurveyNameEdit() {
    if (this.editingSurvey) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Validate survey name
   * 
   * @param callback 
   */
  validateSurveyName(callback = undefined) {
    this.surveyNameErrorMessage = undefined;
    this.surveyNameIsValid = false;
    if (!this.surveyName || this.surveyName.length < 3) {
      this.surveyNameErrorMessage = "Survey name must have at least 3 characters";
      if (callback) {
        return callback(this.surveyNameIsValid);
      }
      return;
    }

    this.surveyConnModule.validateSurveyName(this.surveyName).then( (result) => {
      this.surveyNameIsValid = true;
      if (callback) {
        return callback(this.surveyNameIsValid);
      }
    }).catch( (error) => {
      this.surveyNameErrorMessage = error;
      if (callback) {
        return callback(this.surveyNameIsValid);
      }
    });
  }

  /**
   * Get questions
   */
  getQuestions() {
    return this.surveyConnModule.getQuestions().filter(
      x => x.deleted === false
      ).filter( x => {
          return Object.prototype.hasOwnProperty.call(x.question, this.surveyConnModule.getIsoByLanguageName(this.defaultLanguage)); 
        });
  }

  /**
   * Add question to survey
   * 
   * @param row 
   */
  addQuestionToSurvey(row) {
    this.chosenSurveyQuestions.push(row);
    this.table.renderRows();
    this.fixForNumOfQuestions = this.chosenSurveyQuestions.length;
  }

  /**
   * Remove question from survey
   * 
   * @param row 
   */
  removeQuestionFromSurvey(row) {
    console.log('Deleting ' + row);
    const index = this.chosenSurveyQuestions.indexOf(row);
    console.log('index' + index);
    this.chosenSurveyQuestions.splice(index, 1);
    this.table.renderRows();
    if (this.chosenSurveyQuestions.length === 0) {
      this.fixForNumOfQuestions = undefined;
    } else {
      this.fixForNumOfQuestions = this.chosenSurveyQuestions.length;
    }
  }

  /**
   * Move question up
   * 
   * @param row 
   */
  moveQuestionUp(row) {
    console.log('Moving up ' + row);
    const index = this.chosenSurveyQuestions.indexOf(row);

    if (index === 0) {
      alert('Question already at the top');
    } else {
      this.chosenSurveyQuestions = this.move(this.chosenSurveyQuestions, index, index - 1);
      this.table.renderRows();
    }

  }

  /**
   * Move question down
   * 
   * @param row 
   */
  moveQuestionDown(row) {

    console.log('Moving down ' + row);
    const index = this.chosenSurveyQuestions.indexOf(row);
    console.log('former index ' + index + ' array len ' + this.chosenSurveyQuestions.length);

    if (index === (this.chosenSurveyQuestions.length - 1)) {
      alert('Question already at the bottom');
    } else {
      this.chosenSurveyQuestions = this.move(this.chosenSurveyQuestions, index, index + 1);
      this.table.renderRows();

    }
  }

  /**
   * Logand
   */
 logand() {
    console.log(this.chosenSurveyQuestions);
   this.table.renderRows();

 }

 /**
  * Survey create or edit
  */
  private surveyCreateOrEdit() {
    let trigger: Trigger;
    switch (this.selectedTriggerType) {
      case 0:
        trigger = new TimedTrigger(this.triggerDate.valueOf());
        console.log('Once');
        break;
      case 1:
        trigger = new TimedRecurringTrigger(this.triggerDate.valueOf(), this.startFrequency);
        console.log('repeatable');
        break;
      case 2:
        trigger = new EventTrigger(this.eventText);
        console.log('event');
        break;
    };

    var surveyPointsInt = parseInt(this.surveyPoints);
    var surveyEstimatedDuration = parseInt(this.estimatedDuration);

    const survey = new Survey(
      this.surveyId,
      this.surveyName,
      this.description,
      surveyEstimatedDuration,
      surveyPointsInt,
      this.surveyConnModule.getIsoByLanguageName(this.defaultLanguage),
      this.surveyVersion,
      this.globalSurveyTimestamp,
      this.startDate.valueOf(),
      this.endDate.valueOf(),
      this.deleted,
      this.urgent,
      this.selectedSurveyType,
      this.selectedCampaigns, // selected campaigns
      trigger,
      undefined,
      this.chosenSurveyQuestions,
      this.edited);

    console.log('survey constructed, sending to server');
    if (this.editingSurvey){
      console.log("Edit existing survey");
      this.surveyConnModule.editSurvey(survey, this.logFun.bind(this));
    } else {
      console.log("Create new survey");
      this.surveyConnModule.newSurvey(survey, this.logFun.bind(this));
    }
  }

  /**
   * Submit survey
   */
  submitSurvey() {
    if (this.editingSurvey) {
      this.surveyCreateOrEdit();
    } else {
      this.validateSurveyName(surveyIsValid => {
        if (surveyIsValid) {
          this.surveyCreateOrEdit();
        } else {
          alert('Some of the forms are invalid!');
        }
      });
    }
  }

  /**
   * Alert
   * 
   * @param resp
   */
  logFun(resp) {
    console.log(resp);

    if (resp.ok) {
      alert('Survey created successfuly! Now you can send it to your users by doing Launch');
      this.location.back();
    } else {
      alert('Survey not sent to server - ' + resp.statusText);
    }
  }

  /**
   * Get event type response
   * 
   * @param resp 
   */
  getEventTypeResponse(resp) {
    this.eventType = resp;
  }

  /**
   * Move position in array
   * 
   * @param array
   * @param from 
   * @param to 
   */
  move(array, from, to) {
    if ( to === from ) {return array; }

    const target = array[from];
    const increment = to < from ? -1 : 1;

    for (let k = from; k !== to; k += increment) {
      array[k] = array[k + increment];
    }
    array[to] = target;
    return array;
  }
}