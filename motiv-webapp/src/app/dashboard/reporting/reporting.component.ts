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
import {SurveyConnectionsService} from '../../providers/survey-connections.service';
import {UtilsService} from "../../providers/utils.service";
import { AuthService} from '../../providers/auth.service';

import * as moment from 'moment';

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.css']
})
export class ReportingComponent implements OnInit {

  usersEmails = undefined;
  usersEmailsVisible = false;

  filteredIssuesToResolve = undefined;
  unfilteredIssuesToResolve = undefined;
  usersWithIssues;
  columnsToShowReporting = ["reportid", "userid", "answerDate", "reportingOs", "errorType", "analysedDate", "addressedDate", "actionsColumn", "errorPriority", "reportedBy", "comments"];

  issueTypes = ["Show all", "Trip not detected", "Trip wrongly detected", "Wrong mode", "UI/UX"];
  possibleErrorPriorities = ["Low", "Medium", "High", "Very high"];
  possibleOriginsOfReport = ["Show all", "Smartphone", "Web"];

  selectedIssueType = "Show all";
  selectedOriginOfReport = "Show all";
  selectedIssuePriority = "Show all";
  emailToFilter = "";

  firstDay;
  lastDay;

  statisticsPerIssueType = undefined;

  constructor(
    private surveyConnectionService: SurveyConnectionsService,
    private utilsService: UtilsService,
    private authService: AuthService  // used in html
    ) { }

  ngOnInit() {
    var currDate = moment().utc();
    this.updateReportsBySelectedWeek(currDate);
  }

  ngAfterViewInit() {     // workaround to set the scroll on top of the page
    window.scrollTo(0, 0);
  }

  /**
   * Get users emails
   */
  getUsersEmails(){
    if(this.filteredIssuesToResolve===undefined){
      this.usersEmailsVisible=false;
      return;
    }
    if(this.usersEmailsVisible){
      this.usersEmailsVisible=false;
      return;
    }
    else{
      this.usersEmailsVisible=true;
    }
    var content = "";
    var emails = []
    for(var i = 0,size = this.filteredIssuesToResolve.length; i<size;i++){
      var alreadyIn = false;
      var currEmail = this.getEmailByReport(this.filteredIssuesToResolve[i]);
      for(var h=0; h<emails.length;h++){
        if(emails[h]==currEmail){
          alreadyIn=true;
          break;
        }
      }
      if(alreadyIn){
        continue;
      }
      else{
        emails.push(currEmail);
      }
      if(emails.length===1){
        content+="<"+currEmail+">";
        continue;
      }
      content+=",<"+currEmail+">";
    }
    this.usersEmails = content;
  }

  /**
   * Update reports by selected week
   * 
   * @param selectedDate 
   */
  updateReportsBySelectedWeek(selectedDate){
    this.statisticsPerIssueType = undefined;
    this.filteredIssuesToResolve = undefined;
    this.unfilteredIssuesToResolve = undefined;

    var firstAndLastDay = this.utilsService.getWeekLimitsByWeekDay(selectedDate);

    this.firstDay = firstAndLastDay["firstDay"];
    this.lastDay = firstAndLastDay["lastDay"];

    var firstDayTs = firstAndLastDay["firstDay"].valueOf();
    var lastDayTs = firstAndLastDay["lastDay"].valueOf();

    this.surveyConnectionService.getReportingAnswersFromServer(firstDayTs, lastDayTs).then ( (reportedIssues) => {
      this.filteredIssuesToResolve = reportedIssues.reports;
      this.unfilteredIssuesToResolve = reportedIssues.reports;
      this.usersWithIssues = reportedIssues.users;
      this.applyFilters();
    });
  }

  /**
   * Update reports by selected month
   * 
   * @param selectedDate 
   */
  updateReportsBySelectedMonth(selectedDate){
    this.statisticsPerIssueType = undefined;
    this.filteredIssuesToResolve = undefined;
    this.unfilteredIssuesToResolve = undefined;

    this.firstDay = selectedDate.clone().startOf("month");
    this.lastDay = selectedDate.clone().endOf("month");

    var firstDayMonthTs = selectedDate.clone().startOf("month").valueOf();
    var lastDayMonthTs = selectedDate.clone().endOf("month").valueOf();

    this.surveyConnectionService.getReportingAnswersFromServer(firstDayMonthTs, lastDayMonthTs).then ( (reportedIssues) => {
      this.filteredIssuesToResolve = reportedIssues.reports;
      this.unfilteredIssuesToResolve = reportedIssues.reports;
      this.usersWithIssues = reportedIssues.users;
      this.applyFilters();
    });
  }

  /**
   * Get readable time
   * 
   * @param timestamp 
   */
  getReadableTime(timestamp) {
    return this.utilsService.getReadableTime(timestamp);
  }

  /**
   * Get email by report
   * 
   * @param report 
   */
  getEmailByReport(report) {
    var user = this.usersWithIssues.find(elem => {
      return elem.userid === report.uid;
    });
    return user.email;
  }

  /**
   * Get error type
   * 
   * @param report 
   */
  getErrorType(report) {
    var rs = report.answers.find(elem => {
      return elem.questionID === "5c2f4a353df057a4b2ee4eb1";
    });

    if (rs === undefined){
      return "Unspecified";
    }

    var ans = Number(rs.answer);

    if (ans === 0) {
      return "Trip not detected";
    }
    if (ans === 1) {
      return "Trip wrongly detected";
    }
    if (ans === 2) {
      return "Wrong mode";
    }
    if (ans === 3) {
      return "UI/UX";
    }
    return "Unspecified";
  }

  /**
   * Get error priority
   * 
   * @param report 
   */
  getErrorPriority(report){
    if (!("relativePriority" in report)) {
      return "-";
    } else {
      return this.possibleErrorPriorities[report.relativePriority];
    }
  }

  /**
   * Get origin of report
   * 
   * @param report 
   */
  originOfReport(report){
    if ("reportedByWeb" in report){
      return "Web";
    }
    else {
      return "Smartphone";
    }
  }

  /**
   * Report was analysed
   * 
   * @param report 
   */
  reportWasAnalysed(report){
    return "analysedDate" in report;
  }

  /**
   * Analyse report
   * 
   * @param report 
   */
  analyseReport(report) {
    report["analysedDate"] = Date.now();
    this.surveyConnectionService.updateReporting(report).then( (updatedReport) => {
      console.log("Report updated - ", JSON.stringify(updatedReport));
    });

  }

  /**
   * Report was addressed
   * 
   * @param report 
   */
  reportWasAddressed(report){
    return "addressedDate" in report;
  }

  /**
   * AddressReport
   * 
   * @param report 
   */
  addressReport(report){
    report["addressedDate"] = Date.now();
    if (!("analysedDate" in report)) {
      report["analysedDate"] = report["addressedDate"];
    }
    this.surveyConnectionService.updateReporting(report).then( (updatedReport) => {
      console.log("Report updated - ", JSON.stringify(updatedReport));
    });
  }

  /**
   * Add comment
   * 
   * @param report 
   */
  addComment(report){
    this.surveyConnectionService.updateReporting(report).then( (updatedReport) => {
      console.log("Report updated - ", JSON.stringify(updatedReport));
    });
  }

  /**
   * Apply filters
   */
  applyFilters(){
    // issue type:
    console.log("Filters!");
    console.log("Issue type: ", this.selectedIssueType);
    if (this.selectedIssueType === "Show all"){
      this.filteredIssuesToResolve = this.unfilteredIssuesToResolve;
    } else {
      this.filteredIssuesToResolve = this.unfilteredIssuesToResolve.filter((report) => {
        return this.getErrorType(report) === this.selectedIssueType;
      });
    }

    // email:
    if (this.emailToFilter !== ""){
      var user = this.usersWithIssues.find(elem => {
        return elem.email === this.emailToFilter;
      });
      console.log("search res = ", user);
      if (user === undefined){
        this.filteredIssuesToResolve = [];
      } else {
        this.filteredIssuesToResolve = this.filteredIssuesToResolve.filter((report) => {
          return report.uid === user.userid;
        });
      }
    }

    // priority:
    console.log("Priority filter: ", this.selectedIssuePriority);
    if (this.selectedIssuePriority !== "Show all") {
      this.filteredIssuesToResolve = this.filteredIssuesToResolve.filter((report) => {
        if (!("relativePriority" in report)) {
          return false;
        }
        return this.possibleErrorPriorities[report.relativePriority] === this.selectedIssuePriority;
      });
    }

    // report origin:
    console.log("Report origin: ", this.selectedOriginOfReport);

    if (this.selectedOriginOfReport !== "Show all"){
      this.filteredIssuesToResolve = this.filteredIssuesToResolve.filter((report) => {
        return this.originOfReport(report) === this.selectedOriginOfReport;
      });
    }
    this.calculateStatisticsByIssueType();
  }

  /**
   * Clean filters
   */
  cleanFilters(){
    console.log("Clean filters!");
    this.emailToFilter = "";
    this.selectedIssueType = "Show all";
    this.selectedIssuePriority = "Show all";
    this.selectedOriginOfReport = "Show all";
    this.applyFilters();
  }


  /**
   * Is web report?
   * 
   * @param entry 
   */
  isWebReport(entry){
    return "reportedByWeb" in entry;
  }

  /**
   * Calculate statistics by issue type
   */
  calculateStatisticsByIssueType(){
    this.statisticsPerIssueType = {"Trip not detected": 0, "Trip wrongly detected": 0, "Wrong mode" : 0, "UI/UX": 0};
    this.filteredIssuesToResolve.forEach(element => {
      var currReportIssue = this.getErrorType(element);

      if (currReportIssue === "Trip not detected"){
        this.statisticsPerIssueType["Trip not detected"] += 1;
      } else if (currReportIssue === "Trip wrongly detected"){
        this.statisticsPerIssueType["Trip wrongly detected"] += 1;
      } else if (currReportIssue === "Wrong mode"){
        this.statisticsPerIssueType["Wrong mode"] += 1;
      } else if (currReportIssue === "UI/UX"){
        this.statisticsPerIssueType["UI/UX"] += 1;
      }
    });
  }

  /**
   * Get stats per issue type
   * 
   * @param issueType 
   */
  getStatsPerIssueType(issueType: string) {
    var percentagePart = "0.00";
    if (this.filteredIssuesToResolve.length !== 0) {
      percentagePart = ((this.statisticsPerIssueType[issueType]/this.filteredIssuesToResolve.length) * 100).toFixed(2);
    }
    return this.statisticsPerIssueType[issueType] + " (" + percentagePart + "%)";
  }
}