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
import {MotivUser, UserConnectionsService} from '../../providers/user-connections.service';
import {SelectionModel} from '@angular/cdk/collections';
import {MatTableDataSource} from '@angular/material';

@Component({
  selector: 'app-admin',
  templateUrl: `./admin.component.html`,
  styleUrls: ['./admin.component.css']
})

//Component responsible for managing roles
export class AdminComponent implements OnInit {

  users;
  columnsToShowUsers;

  constructor(
    private userConnectionService: UserConnectionsService
  ) {

  }

  /**
   * Applies a filter to a string to remove extra spaces and convert to lower case
   * 
   * @param filterValue 
   */
  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.users.filter = filterValue;

  }

  ngOnInit() {
    this.columnsToShowUsers = ['userid', 'email', 'rolesActions'];
    this.userConnectionService.getMotivUsersFromServer(this.callbackGetUsers.bind(this));
  }

  callbackGetUsers() {
    this.users = new MatTableDataSource(this.getUsers());
  }

  getUsers() {
    const users = this.userConnectionService.getMotivUsers();
    return users;
  }

  /**
   * Promote user to a new role
   * 
   * @param role 
   * @param user 
   */
  promote(role, user) {
    user.roles.push(role);
    this.userConnectionService.editRoles(user, this.responseHandler.bind(this));
  }

  /**
   * Demote a user to a new role
   * 
   * @param role 
   * @param user 
   */
  demote(role, user) {
    var indexOfRoleToRemove = user.roles.indexOf(role);
    if (indexOfRoleToRemove > -1) {
      user.roles.splice(indexOfRoleToRemove, 1);
    }
    this.userConnectionService.editRoles(user, this.responseHandler.bind(this));
  }

  /**
   * Response handler
   * 
   * @param resp 
   */
  responseHandler(resp) {
    console.log(resp);
    if (resp.ok) {
      alert('Roles edited successfully');
      this.userConnectionService.getMotivUsersFromServer(this.callbackGetUsers.bind(this));
    } else {
      alert('Roles not edited successfully - ' + resp.statusText);
    }
  }
}