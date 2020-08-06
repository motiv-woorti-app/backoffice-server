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
import { Injectable } from '@angular/core';
import {AuthService} from './auth.service';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Question, Survey} from './survey-connections.service';
import {catchError, retry} from 'rxjs/operators';
import {throwError} from 'rxjs/index';
import {ServerCommunicationService} from './server-communication.service';
import {User} from 'firebase';

@Injectable({
  providedIn: 'root'
})
export class UserConnectionsService {

  users: MotivUser[] = [];

  constructor(private authService: AuthService,
              private serverCommunicationService: ServerCommunicationService)
              { }

  /**
   * Endpoint to edit roles of user
   * 
   * @param motivUser 
   * @param callbackEditRoles 
   */
  public editRoles(motivUser: MotivUser, callbackEditRoles: (resp) => void): void {
    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.editRoles(token, motivUser).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        console.log(headers);
        callbackEditRoles(resp);
      });
    });
  }

  /**
   * Get motiv users from server (endpoint)
   * 
   * @param callbackGetUsers 
   */
  public getMotivUsersFromServer(callbackGetUsers: (resp) => void): void {
    console.log( '--- getMotivUsersFromServer ');
    this.authService.getToken().then( (token) => {
      this.serverCommunicationService.getUsers(token).subscribe(resp => {
        const keys = resp.headers.keys();
        const headers = keys.map(key =>
          `${key}: ${resp.headers.get(key)}`);
        this.users = Array.from(resp.body);
        console.log( 'questions: ' + this.users.length);
        console.log( 'questions: ' + typeof(this.users));

        callbackGetUsers(resp.body);
      });

    });
  }

  /**
   * Get motiv users
   * 
   * @returns list of users
   */
  public getMotivUsers(): MotivUser[] {
    return this.users;
  }

  /**
   * Get users by ids
   * 
   * @param idsOfUsers 
   */
  public getUsersByIds(idsOfUsers) : Promise<any>{
    let promise = new Promise((resolve, reject) => {
      this.authService.getToken().then( (token) => {
        this.serverCommunicationService.getUsersByIds(token, idsOfUsers).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getUsersByIds: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }
}

export class MotivUser {
  userid: string;
  email: string;
  roles: string[];
  age: number;
  onCampaigns: string[];
  managesCampaign: string[];
  pushNotificationToken: string;
}
