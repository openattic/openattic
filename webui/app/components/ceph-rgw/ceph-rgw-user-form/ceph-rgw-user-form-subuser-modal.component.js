/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

class CephRgwUserFormSubuserModal {
  constructor ($scope, cephRgwHelpersService) {
    this.$scope = $scope;
    this.cephRgwHelpersService = cephRgwHelpersService;

    this.editing = false;
    this.subuser = {};
  }

  $onInit () {
    this.user = this.resolve.user;
    this.index = this.resolve.index;

    if (!angular.isNumber(this.index)) { // Add
      this.editing = false;
      this.subuser = {
        generate_secret: true,
        secret_key: ""
      };
      // Check if subuser already exists.
      this.$scope.$watch("$ctrl.subuser.subuser", (subuserId) => {
        if (!angular.isString(subuserId) || (subuserId === "")) {
          return;
        }
        this.user.subusers.forEach((subuser) => {
          this.$scope.form.subuser.$setValidity("uniquesubuser",
            this.cephRgwHelpersService.getSubuserName(subuser.id) !== subuserId);
        });
      });
    } else { // Edit
      this.editing = true;
      this.subuser = angular.copy(this.user.subusers[this.index]);
      // Modify the subuser data.
      this.subuser.subuser = this.cephRgwHelpersService.getSubuserName(this.subuser.id);
    }
  }

  submitAction (form) {
    if (this.editing) { // Edit
      if (form.$valid === true) {
        this.modalInstance.close({
          "action": "modify",
          "data": this.subuser
        });
      }
    } else { // Add
      if (form.$valid === true) {
        this.modalInstance.close({
          "action": "add",
          "data": this.subuser
        });
      }
    }
  }

  cancelAction () {
    this.modalInstance.dismiss("close");
  }
}

export default {
  template: require("./ceph-rgw-user-form-subuser-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: CephRgwUserFormSubuserModal
};
