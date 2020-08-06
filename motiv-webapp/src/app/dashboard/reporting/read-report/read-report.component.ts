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
import { ActivatedRoute } from '@angular/router';
import {SurveyConnectionsService} from '../../../providers/survey-connections.service';
import { findIndex } from 'rxjs/operators';

@Component({
  selector: 'app-read-report',
  templateUrl: './read-report.component.html',
  styleUrls: ['./read-report.component.css']
})
export class ReadReportComponent implements OnInit {

  currentReport;
  emailOfCurrentReport;
  questionsOfReport;
  reportComments : string;
  selectedErrorPriority;
  possibleErrorPriorities = ["Low", "Medium", "High", "Very high"];

  imageWasReceived : boolean = false;
  imageToShow;

  constructor(
    private route: ActivatedRoute,
    private surveyConnectionService: SurveyConnectionsService
  ) { }

  ngOnInit() {
    var reportID = this.route.snapshot.params['reportid'];
    var answersAndUserByReport = this.surveyConnectionService.getAnswersByReportId(reportID);
    this.currentReport = answersAndUserByReport.report;
    this.emailOfCurrentReport = answersAndUserByReport.user.email;
    if (!("comments" in this.currentReport)){
      this.reportComments = "";
    } else {
      this.reportComments = this.currentReport.comments;
    }

    if (!("analysedDate" in this.currentReport)){
      this.currentReport["analysedDate"] = Date.now();
      this.surveyConnectionService.updateReporting(this.currentReport).then( (updatedReport) => {
        console.log("Report updated - ", JSON.stringify(updatedReport));
        this.currentReport = updatedReport;
      });
    }

    if (!("relativePriority" in this.currentReport)){
      this.selectedErrorPriority = "";
    } else {
      this.selectedErrorPriority = this.possibleErrorPriorities[this.currentReport.relativePriority];
    }

    var questionsIds = [];
    this.currentReport.answers.forEach(element => {
      questionsIds.push(element.questionID);
    });

    this.surveyConnectionService.getQuestionsByIds(questionsIds).then((questions) => {
      this.questionsOfReport = questions;
    });

    // Download the image:

    if ("attachmentFilename" in this.currentReport){
      this.surveyConnectionService.downloadImageByName(this.currentReport.attachmentFilename).then ( (image) =>{
        this.createImageFromBlob(image);
        this.imageWasReceived = true;
      });
    }
    
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Create image from blob
   * 
   * @param image 
   */
  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
       this.imageToShow = reader.result;
    }, false);
    if (image) {
       reader.readAsDataURL(image);
    }
   }

   /**
    * Get origin of current report
    */
  originOfCurrentReport() {
    if ("reportedByWeb" in this.currentReport){
      return "Web";
    }
    else {
      return "Smartphone";
    }
  }

  /**
   * Set new priority to report
   */
  setNewPriority () {
    var newPriority = this.possibleErrorPriorities.indexOf(this.selectedErrorPriority);
    this.currentReport["relativePriority"] = newPriority;
    this.surveyConnectionService.updateReporting(this.currentReport).then( (updatedReport) => {
      this.currentReport = updatedReport;
    });
  }

  /**
   * Report was addressed?
   */
  reportWasAddressed() {
    return "addressedDate" in this.currentReport;
  }

  /**
   * Mark as addressed
   */
  markAddressed(){
    this.currentReport["addressedDate"] = Date.now();
    this.surveyConnectionService.updateReporting(this.currentReport).then( (updatedReport) => {
      console.log("Report updated - ", JSON.stringify(updatedReport));
      this.currentReport = updatedReport;
    });
  }

  /**
   * Save comment
   */
  saveComment() {
    this.currentReport["comments"] = this.reportComments;
    this.surveyConnectionService.updateReporting(this.currentReport).then( (updatedReport) => {
      console.log("Report updated - ", JSON.stringify(updatedReport));
      this.currentReport = updatedReport;
    });
  }

  /**
   * Get question text by id
   * 
   * @param questID 
   */
  getQuestionTextById(questID) {
    var language = "eng";
    return this.questionsOfReport[questID].question[language];
  }

  /**
   * Get answers text
   * 
   * @param answer 
   */
  getAnswerText(answer) {
    if (answer.questionType === "paragraph" || answer.questionType === "shortText"){
      return answer.answer;
    } 
    if (answer.questionType === "multipleChoice"){
      var questId = answer.questionID;
      var language = "eng";
      var answerPosition = answer.answer;
      return this.questionsOfReport[questId].answers[language][answerPosition];
    }
    return "NULL";
  }

  /**
   * Get readable time
   * 
   * @param timestamp 
   */
  getReadableTime(timestamp) {
    var date = new Date(timestamp);
    return date.toLocaleString('en-GB', { hour12: false });
  }
}