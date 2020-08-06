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
import { Router  , ActivatedRoute } from '@angular/router';
import {SurveyConnectionsService, Question} from '../../../providers/survey-connections.service';

@Component({
  selector: 'app-add-question-translation',
  templateUrl: './add-question-translation.component.html',
  styleUrls: ['./add-question-translation.component.css']
})
export class AddQuestionTranslationComponent implements OnInit {
  currQuestionId : string;
  currQuestion : Question;

  languagesAvailableToShow : string[];
  languagesAllTranslations : string[];
  selectedLanguageToShow : string;
  selectedLanguageTranslation : string;

  questionHaveAnswers : boolean;

  translatedQuestion : string;
  translatedAnswers : string[];

  constructor(
    private surveyConnection: SurveyConnectionsService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.currQuestionId = this.route.snapshot.params['questionid'];
    this.currQuestion = this.getQuestionById(this.currQuestionId);
    this.questionHaveAnswers = this.haveAnswers();
    var languages = [];
    this.surveyConnection.availableLanguages.forEach(element => {
      languages.push(element.name);
    });
    this.languagesAllTranslations = languages;

    this.selectedLanguageTranslation = this.surveyConnection.getLanguageNameByIso(this.currQuestion.languageOfCreation);
    var langsOfQuestion: string[] = [];
    Object.keys(this.currQuestion.question).forEach(lang => {
      langsOfQuestion.push(this.surveyConnection.getLanguageNameByIso(lang));
    });
    this.languagesAvailableToShow = langsOfQuestion;
    this.selectedLanguageToShow = this.surveyConnection.getLanguageNameByIso(this.currQuestion.languageOfCreation);


    this.translatedAnswers = [];
    if (this.questionHaveAnswers){
      this.currQuestion.answers[this.isoOfCurrLang()].forEach( (ans) => {
        this.translatedAnswers.push(undefined);
      });
    }
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Get question by id
   * 
   * @param id 
   */
  getQuestionById(id: string) {
    let questions = this.surveyConnection.getQuestions();
    for (var i = 0; i < questions.length; i++){
      if (questions[i].questionId === id){
        return questions[i];
      }
    }
    return null;
    
  }

  /**
   * iso of curr lang
   */
  isoOfCurrLang(): string {
    return this.surveyConnection.getIsoByLanguageName(this.selectedLanguageToShow);
  }

  /**
   * have answers
   */
  haveAnswers() : boolean {
    let result = false;
    this.surveyConnection.questionTypeArray.forEach(element => {
      if (element.type === this.currQuestion.questionType){
        result = element.allowsMC;
      }
    });
    return result;
  }

  /**
   * Add translation
   * 
   * @param idx 
   */
  addTranslation(idx) : void {
    // quest check
    if (this.translatedQuestion === undefined || this.translatedQuestion.length < 1){
      alert('Provide the translation of the question!');
      return;
    }

    // check answers
    if (this.questionHaveAnswers){
      console.log("LEN ANSWERS = " + this.translatedAnswers.length);

      var allHasTranslation = true;
      this.translatedAnswers.forEach( (answ) => {
        console.log("-   ANSWERS ELEMS = " + answ);
        if (answ === undefined || answ.length < 1){
          allHasTranslation = false;
        }
      });
      if (!allHasTranslation){
        alert('Provide the translation for each answer!');
        return;
      }
    }
    let isoLang = this.surveyConnection.getIsoByLanguageName(this.selectedLanguageTranslation);
    this.currQuestion.question[isoLang] = this.translatedQuestion;
    this.currQuestion.answers[isoLang] = this.translatedAnswers;

    console.log("RES: " + JSON.stringify(this.currQuestion));

    new Promise ((resolve, reject) => {
      this.surveyConnection.editQuestion(this.currQuestion, resolve);
    }).then( () => {
      this.translatedQuestion = undefined;
      this.translatedAnswers = [];
      if (this.questionHaveAnswers){
        this.currQuestion.answers[this.isoOfCurrLang()].forEach( (ans) => {
          this.translatedAnswers.push(undefined);
        });
      }
      if (!this.languagesAvailableToShow.includes(this.selectedLanguageTranslation)){
        this.languagesAvailableToShow.push(this.selectedLanguageTranslation); // added language can be eddited now
      }
    });
  }
}