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

var app = angular.module("openattic.settings");
app.component("settingsForm",  {
  templateUrl: "components/settings/settings-form/settings-form.component.html",
  bindings: {
  },
  controller: function ($scope, $state, $timeout, settingsFormService, Notification) {
    var self = this;

    self.model = {
      deepsea: {},
      rgw: {}
    };

    var defaultRgwDeepseaSettings = {
      managed_by_deepsea: true
    };
    self.rgwDeepseaSettings = angular.copy(defaultRgwDeepseaSettings);
    self.managedByDeepSeaEnabled = true;

    self.deepseaConnectionStatus = undefined;
    self.rgwConnectionStatus = undefined;

    self.$onInit = function () {
      settingsFormService.get()
      .$promise
      .then(function (res) {
        self.model = res;
        if (!self.model.rgw.managed_by_deepsea) {
          self.managedByDeepSeaEnabled = false;
        }
        self.checkDeepSeaConnection();
      })
      .catch(function (error) {
        self.error = error;
      });
    };

    var isAllDeepSeaPropsDefined = function (deepsea) {
      return angular.isDefined(deepsea.host) &&
        angular.isDefined(deepsea.port) &&
        angular.isDefined(deepsea.eauth) &&
        (
          (deepsea.eauth === "auto" &&
           angular.isDefined(deepsea.username) &&
           angular.isDefined(deepsea.password)) ||
          (deepsea.eauth === "sharedsecret" &&
           angular.isDefined(deepsea.username) &&
           angular.isDefined(deepsea.shared_secret))
        );
    };

    var checkDeepSeaConnectionTimeout;
    self.checkDeepSeaConnection = function () {
      self.deepseaConnectionStatus = undefined;
      if (checkDeepSeaConnectionTimeout) {
        $timeout.cancel(checkDeepSeaConnectionTimeout);
      }
      if (isAllDeepSeaPropsDefined(self.model.deepsea)) {
        self.deepseaConnectionStatus = {
          loading: true
        };
        checkDeepSeaConnectionTimeout = $timeout(function () {
          self.rgwDeepSeaSettings = angular.copy(defaultRgwDeepseaSettings);
          settingsFormService.checkDeepSeaConnection(self.model.deepsea)
          .$promise
          .then(function (res) {
            self.deepseaConnectionStatus = res;
            if (self.deepseaConnectionStatus.success) {
              settingsFormService.getRgwConfiguration(self.model.deepsea)
              .$promise
              .then(function (res) {
                if (res.success) {
                  self.rgwDeepSeaSettings = res.rgw;
                  self.managedByDeepSeaEnabled = true;
                  angular.extend(self.rgwDeepSeaSettings, defaultRgwDeepseaSettings);
                } else {
                  self.model.rgw.managed_by_deepsea = false;
                  self.managedByDeepSeaEnabled = false;
                }
                self.rgwManagedByDeepSeaChangeHandler();
              });
            } else {
              self.model.rgw.managed_by_deepsea = false;
              self.managedByDeepSeaEnabled = false;
              self.rgwManagedByDeepSeaChangeHandler();
            }
          })
          .catch(function () {
            self.deepseaConnectionStatus = undefined;
          });
        }, 1000);
      }
    };

    var isAllRgwPropsDefined = function (rgw) {
      return angular.isDefined(rgw.host) &&
          angular.isDefined(rgw.port) &&
          angular.isDefined(rgw.access_key) &&
          angular.isDefined(rgw.secret_key) &&
          angular.isDefined(rgw.user_id) &&
          angular.isDefined(rgw.use_ssl);
    };

    var checkRgwConnectionTimeout;
    self.checkRgwConnection = function () {
      self.rgwConnectionStatus = undefined;
      if (checkRgwConnectionTimeout) {
        $timeout.cancel(checkRgwConnectionTimeout);
      }
      if (isAllRgwPropsDefined(self.model.rgw)) {
        self.rgwConnectionStatus = {
          loading: true
        };
        checkRgwConnectionTimeout = $timeout(function () {
          settingsFormService.checkRgwConnection(self.model.rgw)
            .$promise
            .then(function (res) {
              self.rgwConnectionStatus = res;
            })
            .catch(function () {
              self.rgwConnectionStatus = undefined;
            });
        }, 1000);
      }
    };

    self.rgwManagedByDeepSeaChangeHandler = function () {
      if (self.model.rgw.managed_by_deepsea) {
        self.model.rgw = angular.copy(self.rgwDeepSeaSettings);
      }
      self.checkRgwConnection();
    };

    self.saveAction = function () {
      settingsFormService.save(self.model)
        .$promise
        .then(function () {
          Notification.success({
            msg: "Settings has been saved successfully"
          });
          $scope.settingsForm.$submitted = false;
          $scope.settingsForm.$dirty = false;
        }, function () {
          $scope.settingsForm.$submitted = false;
        });
    };

  }
});
