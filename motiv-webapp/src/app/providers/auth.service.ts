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
import { Observable } from 'rxjs';
import {Router} from '@angular/router';

import { AngularFireAuth} from 'angularfire2/auth';


import * as firebase from 'firebase';
import {ServerCommunicationService} from './server-communication.service';
import {User} from 'firebase';

@Injectable()
export class AuthService {

  private currUserRoles;

  constructor(
    private firebase: AngularFireAuth,
    private tripService: ServerCommunicationService,
    private router: Router
  ) {}

  /**
   * Get current user
   */
  getCurrentUser(): User {
    return this.firebase.auth.currentUser;
  }

  /**
   * Check role
   * 
   * @param role 
   */
  checkRole(role): boolean {
    if (this.currUserRoles) {
      if (this.currUserRoles.indexOf(role) > -1) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  /**
   * Check any of roles
   * 
   * @param roles 
   */
  checkAnyOfRoles(roles: [String]): boolean {
    var hasSomeRole = false;
    if (this.currUserRoles) {
      roles.forEach(role => {
        if (this.currUserRoles.indexOf(role) > -1) {
          hasSomeRole = true;
        }
      });
    }
    return hasSomeRole;
  }

  /**
   * Login 
   * 
   * @param email 
   * @param password 
   * @param callback 
   */
  login(email, password, callback : (err, user) => void ): void {
    this.firebase.auth.signInWithEmailAndPassword(email, password).then( (user) => {
      console.log('--login: Logged in user = ' + this.getCurrentUser().uid);

        this.getToken().then( (token) => {

        this.tripService.getRoles(this.getCurrentUser().uid, token).subscribe(response => {
          const arrayRoles = Array.from(response.body.roles);
          console.log('--login array Roles = ' + arrayRoles + ' , type = ' + typeof arrayRoles);
          this.currUserRoles = arrayRoles;

          callback(null, this.getCurrentUser());
        });
      });

    }).catch( (error) => {
      callback(error, null);
    });
  }

  /**
   * Login with google
   * 
   * @param callback 
   */
  loginWithGoogle(callback : (err, user) => void): void {
    this.firebase.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then((result) => {

      this.getToken().then( (token) => {

        this.tripService.getRoles(this.getCurrentUser().uid, token).subscribe(response => {
          const arrayRoles = Array.from(response.body.roles);
          console.log('--login array Roles = ' + arrayRoles + ' , type = ' + typeof arrayRoles);
          this.currUserRoles = arrayRoles;

          callback(null, this.getCurrentUser());
        });

      });

    }).catch(function(error) {
      callback(error, null);
    });
}

  isAuthenticated(): boolean {

    const user = firebase.auth().currentUser;

    if (user) {
      // User is signed in.
      return true;
    } else {
      return false;
    }
  }

  /**
   * Get Token
   */
  getToken(): Promise<any> {
    return this.firebase.auth.currentUser.getIdToken(false).then((token) => {
      return token;
    }).catch( (error) => {
      console.error('Error : ' + error);

    });
  }

  /**
   * Returns legal files
   */
  public getLegalFiles(): Promise<any> {
    let promise = new Promise((resolve, reject) => {
      this.getToken().then( (token) => {
        this.tripService.getLegalFiles(token).subscribe ( (response) => {
          if (response.status === 200){
            resolve(response.body);
          } else{
            console.log("getLegalFiles: error");
            reject(response);
          }
        });
      });
    });
    return promise;
  }

  /**
   * Logout
   */
  logout(): void {
    this.firebase.auth.signOut().then( () => {
      console.log('Logged out with success');
      this.router.navigateByUrl('/login').then((status) => {
        console.log('status: ' + status);
      });
    }).catch( (error) => {
      console.error('Error : ' + error);
    });
  }

}

