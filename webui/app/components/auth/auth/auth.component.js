/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

import globalConfig from "globalConfig";

class AuthComponent {
  constructor ($scope, $rootScope, $state, authService) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$state = $state;
    this.authService = authService;

    this.fieldRequired = "This field is required.";
    this.correctInput = "The given credentials are not correct.";

    this.$scope.$watchGroup(["$ctrl.username", "$ctrl.password"], () => {
      this.submitted = false;
    });
  }

  $onInit () {

    if (angular.isDefined(globalConfig.GUI.quickLogin.username) && globalConfig.GUI.quickLogin.username !== "" &&
    angular.isDefined(globalConfig.GUI.quickLogin.password) && globalConfig.GUI.quickLogin.password !== "") {
      this.username = globalConfig.GUI.quickLogin.username;
      this.password = globalConfig.GUI.quickLogin.password;
    }

    if (this.user) {
      this.$state.go("dashboard");
    }
  }

  login () {
    this.submitted = true;
    this.loginFailed = false;
    var loginData = {
      "username": this.username,
      "password": this.password
    };
    this.authService.login(loginData, (res) => {
      this.$rootScope.user = res;
      this.$state.go("dashboard");
    }, (error) => {
      error.ignoreStatusCode(401);
      this.loginFailed = true;
    });
  }
}

export default {
  controller: AuthComponent,
  template: require("./auth.component.html")
};
