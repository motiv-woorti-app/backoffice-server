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
import {SurveyDataPassingServiceService} from './survey-data-passing-service.service';

import {SurveyConnectionsService, Question, Survey} from '../../providers/survey-connections.service';
import {Router} from '@angular/router';
import { AuthService } from 'src/app/providers/auth.service';
import { MatTableDataSource } from '@angular/material';


@Component({
  selector: 'app-surveys',
  templateUrl: `./surveys.component.html`,
  styleUrls: ['./surveys.component.css']
})
export class SurveysComponent implements OnInit {

  columnsToShowQuestion;
  columnsToShowSurveys;

  selectedSurveyToExport;
  selectedFormat = "JSON";

  surveyToBePassed;

  surveysSource = undefined;
  listOfsurveysData;

  constructor(
    private surveyConnection: SurveyConnectionsService,
    private router: Router,
    private dataService: SurveyDataPassingServiceService,
    private authService: AuthService    // used in html
  ) {
    this.columnsToShowQuestion = ['id', 'question', 'language', 'type', 'deleted', 'actionsColumn'];
    this.columnsToShowSurveys = ['id', 'version', 'name', 'type', 'launched', 'actionsColumn'];
  }

  ngOnInit() {
    this.surveyConnection.getQuestionsFromServer();
    this.surveyConnection.getSurveysFromServer();
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Edit question
   * 
   * @param row 
   */
  editQuestion(row) {
    console.log('edit' + row.id);
    this.surveyConnection.editQuestion(row, ()=>{} );
  }

  /**
   * Edit survey
   * 
   * @param survey 
   */
  editSurvey(survey){
    this.router.navigate(['/dashboard/surveys/createSurvey'], {queryParams: {surveyToEdit: JSON.stringify(survey)}});
  }

  /**
   * Duplicate survey
   * 
   * @param survey 
   */
  duplicateSurvey(survey){
    this.router.navigate(['/dashboard/surveys/createSurvey'], {queryParams: {surveyToDuplicate: JSON.stringify(survey)}});
  }

  /**
   * Delete question
   */
  deleteQuestion(question) {
    this.surveyConnection.deleteQuestion(question);
  }

  /**
   * Deactivate survey
   * 
   * @param survey 
   */
  deactivateSurvey(survey) {
    console.log("Survey to delete: ", survey);
    this.surveyConnection.deleteSurvey(survey).then(updatedSurvey => {
      var indexOfSurvey = this.listOfsurveysData.indexOf(survey);
      this.listOfsurveysData[indexOfSurvey] = updatedSurvey;
      this.surveysSource = new MatTableDataSource<Survey>(this.listOfsurveysData);
    });
  }

  /**
   * Get question
   */
  getQuestions() {
    return this.surveyConnection.getQuestions();
  }

  /**
   * Get surveys
   */
  getSurveys() {
    if (this.surveysSource === undefined) {
      if (this.surveyConnection.getSurveys() !== undefined){
        this.listOfsurveysData = this.surveyConnection.getSurveys().sort((a, b) => b.surveyID - a.surveyID);
        this.surveysSource = new MatTableDataSource<Survey>(this.listOfsurveysData);
      }
      return this.surveysSource;
    } else {
      return this.surveysSource;
    }
  }

  /**
   * Survey status
   * 
   * @param survey 
   */
  surveyStatus(survey){
    if (!survey.launch){
      return "Not launched";
    } else {
      if (survey.deleted) {
        return "Deactivated";
      } else {
        return "Launched";
      }
    }
  }

  /**
   * Launch survey
   * 
   * @param survey 
   */
  launchSurvey(survey) {
    this.router.navigate(['/dashboard/surveys/launch'], {queryParams: {survey: JSON.stringify(survey)}});
  }

  /**
   * Build survey answers csv
   * 
   * @param questions 
   * @param surveyAnswers 
   */
  buildSurveyAnswersCsv(questions, surveyAnswers) {

    /**
     * Language selector
     * 
     * @param objectWithLanguageSelection 
     */
    var languageSelector = function(objectWithLanguageSelection) {
      var availableLanguages = Object.keys(objectWithLanguageSelection);
      if (availableLanguages.includes("eng")){    // from email: "se for text, print em inglês ou primeira língua"
        return "eng";
      } else {
        return availableLanguages[0];
      }
    };

    /**
     * Get answer by question id
     * 
     * @param questionId 
     * @param answers 
     */
    var getAnswerByQuestionId = function(questionId, answers) {
      var res;
      answers.forEach(answer => {
        if (answer.questionID === questionId) {
          res = answer.answer;
        }
      });
      return res;
    };

    /**
     * Get string with text answers
     * 
     * @param answers 
     */
    var getStringWithTextAnswers = function(answers) {
      var res = "";
      questions.forEach(question => {
        var currQuestionId = question.questionId;
        var currQuestType = question.questionType;
        var currAnswer = getAnswerByQuestionId(currQuestionId, answers);
        if (currQuestType === "shortText" || currQuestType === "paragraph"){
          res += '"' + currAnswer + '"' + ";";
        } else if (currQuestType === "multipleChoice") {
          res += '"' + question.answers[languageSelector(question.answers)][currAnswer] + '"' + ";";
        } else if (currQuestType === "yesNo") { // boolean responses
          res += '"' + currAnswer + '"' + ";";
        } else if (currQuestType === "checkboxes") {          
          for (var j=0; j < question.answers[question.languageOfCreation].length; j++) {
            if (currAnswer.includes(j)) {
              res += '"' + question.answers[question.languageOfCreation][j] + '"' + ";";
            } else {
              res += ";";
            }
          }
          
        } else {
          res += '"' + currAnswer.toString() + '"' + ";";
        }
      });
      return res;
    };

    var content = "Question number;Type;ID;Question\n";
    for (var j=0; j<questions.length; j++){
      var question = questions[j];
      content += (j+1) + ";" + question.questionType + ";" + question.questionId + ";" + question.question[languageSelector(question.question)] + "\n";
    }
    content += "\n";
    content += "userid;answerDate;";
    for (var j=0; j<questions.length; j++){
      var question = questions[j];
      var columnNamesToAdd = "Answer " + (j+1) + ";";
      if (question.questionType === "checkboxes") {
        content += columnNamesToAdd.repeat(question.answers[question.languageOfCreation].length);
      } else {
        content += columnNamesToAdd;
      }
    }
    content += "\n";

    surveyAnswers.forEach(answer => {
      content += answer.uid + ";" + answer.answerDate + ";" + getStringWithTextAnswers(answer.answers) + "\n";
    });

    return content;
  }


  /**
   * Build survey answers csv format 2
   * 
   * @param questions 
   * @param surveyAnswers 
   */
  buildSurveyAnswersCsv_format2(questions, surveyAnswers) {

    /**
     * Language selector
     * 
     * @param objectWithLanguageSelection 
     */
    var languageSelector = function(objectWithLanguageSelection) {
      var availableLanguages = Object.keys(objectWithLanguageSelection);
      if (availableLanguages.includes("eng")){    // from email: "se for text, print em inglês ou primeira língua"
        return "eng";
      } else {
        return availableLanguages[0];
      }
    };

    /**
     * Get answers by question id
     * 
     * @param questionId 
     * @param answers 
     */
    var getAnswerByQuestionId = function(questionId, answers) {
      var res;
      answers.forEach(answer => {
        if (answer.questionID === questionId) {
          res = answer.answer;
        }
      });
      return res;
    };

    /**
     * Get string with text answers
     * 
     * @param answers 
     */
    var getStringWithTextAnswers = function(answers) {
      var res = "";
      for (var i=0; i<questions.length; i++){
        var question = questions[i];
        var currQuestionId = question.questionId;
        var currQuestType = question.questionType;
        var currAnswer = getAnswerByQuestionId(currQuestionId, answers);
        if (currQuestType === "shortText" || currQuestType === "paragraph"){
          res += '"' + currAnswer + '"' + ";";
        } else if (currQuestType === "yesNo") { // boolean responses
          res += '"' + currAnswer + '"' + ";";
        } else if (currQuestType === "checkboxes") {          
          for (var j=0; j < question.answers[question.languageOfCreation].length; j++) {
            if (currAnswer.includes(j)) {
              res += '"' + 1 + '"' + ";";
            } else {
              res += ";";
            }
          }

        } else if (currQuestType === "multipleChoice") {
          for (var j=0; j < question.answers[question.languageOfCreation].length; j++) {
            if (currAnswer === j) {
              res += '"' + 1 + '"' + ";";
            } else {
              res += ";";
            }
          }

        } else {
          res += '"' + currAnswer.toString() + '"' + ";";
        }
      }
      return res;
    };


    var content = "Question number;Type;ID;Question\n";

    for (var j=0; j<questions.length; j++){
      var question = questions[j];
      content += (j+1) + ";" + question.questionType + ";" + question.questionId + ";" + '"' + question.question[languageSelector(question.question)] + '"' + "\n";
    }
    content += "\n";

    // print all options in all available languages:
    var availableLanguagesSet = new Set();
    for (var j=0; j<questions.length; j++){  // 1) find all available languages (even if available only for 1 question)
      var question = questions[j];
      var languages = Object.keys(question.answers);
      languages.forEach(lang => {
        availableLanguagesSet.add(lang);
      });
    }
    
    var availableLanguages = [];
    availableLanguages.push(...Array.from(availableLanguagesSet.values())); // append the rest of the languages
    availableLanguages.forEach(lang => {     // 2) print answer options for each available language
      content += "," + lang + ",";
      for (var j=0; j<questions.length; j++){
        var question = questions[j];
        var langOfCreation = question.languageOfCreation;
        if (question.questionType === "checkboxes" || question.questionType === "multipleChoice"){ // only these have answer alternatives

          if (question.answers[lang]){       // question is not defined for current language
            question.answers[lang].forEach(answerAlternative => {
              content +='"' + answerAlternative + '"' + ",";
            });
          } else {             // question is not defined for current language 
            question.answers[langOfCreation].forEach(answerAlternative => {
              content += ","; 
            });
          }

        } else {    // other question types doen't have answer alternatives, but only one answer introduced by the user
          content += ",";
        }
      }
      content += "\n";
    });
    
    content += "\n";
    content += "userid;answerDate;";

    for (var j=0; j<questions.length; j++){
      var question = questions[j];
      var columnNamesToAdd = "Answer " + (j+1) + ";";
      if (question.questionType === "checkboxes" || question.questionType === "multipleChoice") {
        content += columnNamesToAdd.repeat(question.answers[question.languageOfCreation].length);
      } else {
        content += columnNamesToAdd;
      }
    }
    content += "\n";

    surveyAnswers.forEach(answer => {
      content += answer.uid + ";" + answer.answerDate + ";" + getStringWithTextAnswers(answer.answers) + "\n";
    });
    return content;
  }

  /**
   * Export answers of survey
   */
  exportAnswersOfSurvey(){

    var surveyId = this.selectedSurveyToExport.surveyID;
    var filename = this.selectedSurveyToExport.surveyName + "_answersData";
    this.surveyConnection.exportAnswersOfSurvey(surveyId).then( (res) => {
      // download file :
      const link = document.createElement('a');
      document.body.appendChild(link);
      var blob;
      // TEMP: comment while only JSON is available
      if(this.selectedFormat === "JSON"){
        blob = new Blob([JSON.stringify(res, null, 2)], { type: 'octet/stream' });
        link.download = filename + ".json";
      } else {
        var csv = this.buildSurveyAnswersCsv(this.selectedSurveyToExport.questions, res);
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;base64' });
        link.download = filename + ".csv";
      }

      var url = window.URL.createObjectURL(blob);
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    });
  }

  /**
   * Export answers of survey format 2
   */
  exportAnswersOfSurveyFormat2(){
    var surveyId = this.selectedSurveyToExport.surveyID;
    var filename = this.selectedSurveyToExport.surveyName + "_answersData_v2";

    this.surveyConnection.exportAnswersOfSurvey(surveyId).then( (res) => {
      // download file :
      const link = document.createElement('a');
      document.body.appendChild(link);

      var csv = this.buildSurveyAnswersCsv_format2(this.selectedSurveyToExport.questions, res);
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;base64' });
      link.download = filename + ".csv";

      var url = window.URL.createObjectURL(blob);
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    });
  }
}