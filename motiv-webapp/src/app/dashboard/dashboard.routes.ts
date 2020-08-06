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
import {Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {HomeComponent} from './home/home.component';
import {AdminComponent} from './admin/admin.component';
import {AuthGuard} from '../guards/auth.guard';
import {RoleGuard} from '../guards/role.guard';
import {SurveysComponent} from './surveys/surveys.component';
import {CreateQuestionComponent} from './surveys/create-question/create-question.component';
import {CreateSurveyComponent} from './surveys/create-survey/create-survey.component';
import {CampaignComponent} from './campaign/campaign.component';
import { LaunchSurveyComponent } from './surveys/launch-survey/launch-survey.component';
import {CreateCampaignComponent} from './campaign/create-campaign/create-campaign.component';
import {PrivacyPolicyComponent} from '../privacy-policy/privacy-policy.component';
import {AddQuestionTranslationComponent} from './surveys/add-question-translation/add-question-translation.component';
import {ReportingComponent} from './reporting/reporting.component';
import {ReadReportComponent} from './reporting/read-report/read-report.component';
import {CreateReportComponent} from './reporting/create-report/create-report.component';
import {TripsSummaryComponent} from './trips-summary/trips-summary.component';
import {TripInfoComponent} from './trips-summary/trip-info/trip-info.component';
import { ManageCampaignUsersComponent } from './campaign/manage-campaign-users/manage-campaign-users.component';
import { ViewSurveyComponent } from './surveys/view-survey/view-survey.component';
import { RewardsComponent } from './rewards/rewards.component';
import { CreateRewardComponent } from './rewards/create-reward/create-reward.component';
import { EditRewardComponent } from './rewards/edit-reward/edit-reward.component';
import { ManageRewardComponent } from './rewards/manage-reward/manage-reward.component';

export const dashboardRoutes: Routes = [
  {
    path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], children: [ // , canActivateChild:[AuthGuard]
      {path: '', redirectTo: 'home', pathMatch: 'full'},
      {path: 'home', component: HomeComponent},
      {path: 'admin', component: AdminComponent, canActivate: [RoleGuard], data: {
          requiredRoles: ['Admin'],
          and: false
        }},
      {path: 'surveys', component: SurveysComponent, canActivate: [RoleGuard], data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'surveys/createQuestion', component: CreateQuestionComponent, canActivate: [RoleGuard], data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'surveys/addQuestionTranslation/:questionid', component: AddQuestionTranslationComponent, canActivate: [RoleGuard], data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'surveys/createSurvey', component: CreateSurveyComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'surveys/viewSurvey/:surveyid', component: ViewSurveyComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'surveys/launch', component: LaunchSurveyComponent, canActivate: [RoleGuard],
        data: {
        requiredRoles: ['CM', 'Manager', 'Admin'],
        and: false
      }},      
      {path: 'campaign', component: CampaignComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'campaign/createCampaign', component: CreateCampaignComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['Admin', 'Manager'],
          and: false
        }},
      {path: 'campaign/manageusers/:campaignid', component: ManageCampaignUsersComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['Admin', 'Manager', 'CM'],
          and: false
        }},
      {path: 'rewards', component: RewardsComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'rewards/createReward', component: CreateRewardComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'rewards/editReward', component: EditRewardComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'rewards/manageReward', component: ManageRewardComponent, canActivate: [RoleGuard],
        data: {
          requiredRoles: ['CM', 'Manager', 'Admin'],
          and: false
        }},
      {path: 'trips', component: TripsSummaryComponent, canActivate: [RoleGuard],
        data: {
        requiredRoles: ['Admin', 'Manager'],
        and: false
        }},
      {path: 'trips/info/:tripid', component: TripInfoComponent, canActivate: [RoleGuard],
        data: {
        requiredRoles: ['Admin'],
        and: false
        }},
      {path: 'reporting', component: ReportingComponent, canActivate: [RoleGuard],
        data: {
        requiredRoles: ['Admin', 'Manager'],
        and: false
        }},
      {path: 'reporting/create', component: CreateReportComponent, canActivate: [RoleGuard],
        data: {
        requiredRoles: ['Admin'],
        and: false
        }},
      {path: 'reporting/read/:reportid', component: ReadReportComponent, canActivate: [RoleGuard],
        data: {
        requiredRoles: ['Admin'],
        and: false
        }}    
    ]
  }
];