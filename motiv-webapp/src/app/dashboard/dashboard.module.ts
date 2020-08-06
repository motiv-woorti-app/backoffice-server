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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatListModule} from '@angular/material/list';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { AdminComponent } from './admin/admin.component';
import {RouterModule} from '@angular/router';
import {dashboardRoutes} from './dashboard.routes';
import {RoleGuard} from '../guards/role.guard';
import {AuthGuard} from '../guards/auth.guard';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { SurveysComponent } from './surveys/surveys.component';
import {MatTableModule} from '@angular/material/table';
import {CreateQuestionComponent} from './surveys/create-question/create-question.component';
import {MatCheckboxModule, MatDatepickerModule, MatInputModule, MatNativeDateModule, MatSelectModule} from '@angular/material';
import { CreateSurveyComponent } from './surveys/create-survey/create-survey.component';
import { OldLaunchComponent } from './surveys/old_launch/old_launch.component';
import { CampaignComponent } from './campaign/campaign.component';
import { CreateCampaignComponent } from './campaign/create-campaign/create-campaign.component';
import { OwlDateTimeModule} from 'ng-pick-datetime';
import { OwlMomentDateTimeModule } from 'ng-pick-datetime-moment';
import { PrivacyPolicyComponent } from '../privacy-policy/privacy-policy.component';
import { AddQuestionTranslationComponent } from './surveys/add-question-translation/add-question-translation.component';

import { AgmCoreModule } from '@agm/core';
import { ReportingComponent } from './reporting/reporting.component';
import { ReadReportComponent } from './reporting/read-report/read-report.component';
import { TripsSummaryComponent } from './trips-summary/trips-summary.component';
import { TripInfoComponent } from './trips-summary/trip-info/trip-info.component';
import { CreateReportComponent } from './reporting/create-report/create-report.component';
import { ManageCampaignUsersComponent } from './campaign/manage-campaign-users/manage-campaign-users.component';
import { ViewSurveyComponent } from './surveys/view-survey/view-survey.component';
import { MatMenuModule} from '@angular/material/menu';
import {MatTabsModule} from '@angular/material/tabs';
import { LaunchSurveyComponent } from './surveys/launch-survey/launch-survey.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { RewardsComponent } from './rewards/rewards.component';
import { CreateRewardComponent } from './rewards/create-reward/create-reward.component';
import { EditRewardComponent } from './rewards/edit-reward/edit-reward.component';
import { ManageRewardComponent } from './rewards/manage-reward/manage-reward.component';

@NgModule({
  imports: [
    CommonModule,
    MatListModule,
    RouterModule.forChild(dashboardRoutes),
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatCheckboxModule,
    OwlDateTimeModule,
    OwlMomentDateTimeModule,
    AgmCoreModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  declarations: [
    DashboardComponent,
    HomeComponent, AdminComponent,
    SurveysComponent,
    CreateQuestionComponent,
    CreateSurveyComponent,
    OldLaunchComponent,
    CampaignComponent,
    CreateCampaignComponent,
    AddQuestionTranslationComponent,
    ReportingComponent,
    ReadReportComponent,
    TripsSummaryComponent,
    TripInfoComponent,
    CreateReportComponent,
    ManageCampaignUsersComponent,
    ViewSurveyComponent,
    LaunchSurveyComponent,
    RewardsComponent,
    CreateRewardComponent,
    EditRewardComponent,
    ManageRewardComponent
  ],
  exports: [DashboardComponent],
  providers: []
})
export class DashboardModule {

}
