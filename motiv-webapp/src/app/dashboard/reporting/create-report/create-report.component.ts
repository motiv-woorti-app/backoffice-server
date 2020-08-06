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
import {SurveyConnectionsService, Question} from '../../../providers/survey-connections.service';
import { AuthService} from '../../../providers/auth.service';
import { Location} from '@angular/common';

@Component({
  selector: 'app-create-report',
  templateUrl: './create-report.component.html',
  styleUrls: ['./create-report.component.css']
})
export class CreateReportComponent implements OnInit {

  newReport = {};
  lang : string;
  showErrorMaximumSize : boolean = false;   // TODO: implement a generic mechanism of errors

  questions = [];

  selectedFile: File = null;
  formData = new FormData();

  constructor(
    private surveyConnectionService: SurveyConnectionsService,
    private location: Location,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.surveyConnectionService.getReportingSurvey().then( (reportingSurvey) => {
      this.newReport["version"] = reportingSurvey.version;
      this.newReport["surveyID"] = reportingSurvey.surveyID;
      this.newReport["lang"] = reportingSurvey.defaultLanguage;
      this.newReport["reportingID"] = "";
      this.newReport["reportingOS"] = "";

      this.newReport["uid"] = this.authService.getCurrentUser().uid;
      this.newReport["triggerDate"] = Date.now();

      this.newReport["reportedByWeb"] = true;

      this.questions = reportingSurvey.questions;
      this.lang = reportingSurvey.defaultLanguage;

    });
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Create form data
   * 
   * @param event 
   */
  createFormData(event) {
    this.showErrorMaximumSize = false;
    this.selectedFile = null;
    if ((<File>event.target.files[0]).size >= 600000){
      console.log("File too large, the maximum size is 600 kb");
      this.showErrorMaximumSize = true;
      return;
    }
    this.selectedFile = <File>event.target.files[0];
    console.log("File size (bytes): ", this.selectedFile.size);
  }

  /**
   * Is multiple choise question?
   * 
   * @param question 
   */
  isMultipleChoiseQuestion(question) {
    return question["answers"][this.lang].length !== 0;
  }

  /**
   * Submit report
   */
  submitReport() {
    this.newReport["answerDate"] = Date.now();

    var answers = [];
    this.questions.forEach( (question) => {
      var newAnswer = {};
      newAnswer["questionID"] = question.questionId;
      newAnswer["questionType"] = question.questionType;
      if (this.isMultipleChoiseQuestion(question)){
        newAnswer["answer"] = question.answers[this.lang].indexOf(question.givenAnswer);
      } else {
        if (question.givenAnswer === undefined){
          newAnswer["answer"] = "";
        } else {
          newAnswer["answer"] = question.givenAnswer;
        }
      }
      answers.push(newAnswer);
    });
    this.newReport["answers"] = answers;
    if (this.selectedFile !== null) {
      this.formData.append('file', this.selectedFile, this.selectedFile.name);
    } 

    var jsonReport = JSON.stringify(this.newReport);
    this.formData.append("report", jsonReport);
    this.surveyConnectionService.sendReportingAnswers(this.formData).then ( (resp) => {
      this.location.back();
    });
  }
}