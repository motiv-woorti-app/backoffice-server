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
import {Question, SurveyConnectionsService} from '../../../providers/survey-connections.service';
import { Location} from '@angular/common';
import {Router} from '@angular/router';

@Component({
  selector: 'app-create-question',
  templateUrl: `./create-question.component.html`,
  styleUrls: ['./create-question.component.css']
})
export class CreateQuestionComponent implements OnInit {

  currLanguage : string;
  languagesArray : string[];

  questionTypeSelected;
  questionTypeArray;

  questionText: string;

  multipleChoiceAnswers: string[];

  minRange;
  maxRange;

  constructor(
    private surveyService: SurveyConnectionsService,
    private location: Location,
    private router: Router
  ) {
   
    this.questionTypeArray = [
      {id: 0, type: 'shortText', name: 'Short text', allowsMC: false},
      {id: 1, type: 'multipleChoice', name: 'Radio button', allowsMC: true},
      {id: 3, type: 'checkboxes', name: 'Checkboxes', allowsMC: true},
      {id: 4, type: 'paragraph', name: 'Paragraph', allowsMC: false},
      {id: 6, type: 'yesNo', name: 'Yes/No', allowsMC: false}
    ];
    this.questionTypeSelected = this.questionTypeArray[0];
    this.multipleChoiceAnswers = [];
  }

  ngOnInit() {
    var languages = [];
    this.surveyService.availableLanguages.forEach(element => {
      languages.push(element.name);
    });
    this.languagesArray = languages;
    this.currLanguage = languages[0]; // first language (english)
    this.minRange = 0;
    this.maxRange = 10;
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Add multiple choice answer
   * 
   * @param text 
   */
  addMultipleChoiceAnswer(text: string) {
    console.log('Adding ' + text);
    if (text === undefined || text.length < 1){
      alert('Text of the answer is missing!');
      return;
    }
    this.multipleChoiceAnswers.push(text);
  }

  /**
   * Delete multiple choice answer
   * 
   * @param text 
   */
  deleteMultipleChoiceAnswer(text) {
    console.log('Deleting ' + text);
    const index = this.multipleChoiceAnswers.indexOf(text);
    console.log('index' + index);
    this.multipleChoiceAnswers.splice(index, 1);
  }

  /**
   * Save question
   * 
   * @param addTranslation 
   */
  saveQuestion(addTranslation){
    if (this.questionText === undefined){
      alert('Text of the question is missing!');
      return;
    }
    if (this.questionTypeSelected.allowsMC && this.multipleChoiceAnswers.length < 2){
      alert('Minimum 2 answers required!');
      return;
    }

    if(this.questionTypeSelected.type === 'scale') {
      this.multipleChoiceAnswers = [this.minRange, this.maxRange];
    }
    this.surveyService.newQuestion(this.questionText, this.currLanguage, this.multipleChoiceAnswers, this.questionTypeSelected.type, this.logFun.bind(this), addTranslation);
  }

  /**
   * Alert
   * 
   * @param resp 
   * @param addTranslation 
   * @param questionId 
   */
  logFun(resp, addTranslation, questionId) {
    console.log(resp);

    if (resp.ok) {
      alert('Question sent successfully!');
      if (addTranslation){
        this.router.navigate(['/dashboard/surveys/addQuestionTranslation', questionId]);
      } else {
        this.location.back();
      }
      
    } else {
      alert('Question not sent to server - ' + resp.statusText);
    }
  }
}