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
  controller: function ($scope, $state, $timeout, $q, settingsFormService, cephClusterService, Notification) {
    var self = this;

    var animationTimeout = 300;

    self.model = {
      deepsea: {},
      rgw: {},
      grafana: {}
    };

    self.clusters = undefined;
    self.clustersKeyringCandidates = {};
    self.settingsError = "";
    self.clustersErrors = {};

    var defaultRgwDeepseaSettings = {
      managed_by_deepsea: true
    };
    self.rgwDeepseaSettings = angular.copy(defaultRgwDeepseaSettings);
    self.managedByDeepSeaEnabled = true;

    self.deepseaConnectionStatus = undefined;
    self.rgwConnectionStatus = undefined;
    self.grafanaConnectionStatus = undefined;

    self.$onInit = function () {
      settingsFormService.get()
      .$promise
      .then(function (res) {
        self.model = res;
        if (!self.model.rgw.managed_by_deepsea) {
          self.managedByDeepSeaEnabled = false;
        }
        self.checkDeepSeaConnection();
        self.checkGrafanaConnection();
      })
      .catch(function (error) {
        self.error = error;
      });

      cephClusterService.get()
      .$promise
      .then(function (res) {
        self.clusters = res;
        angular.forEach(self.clusters.results, function (cluster) {
          self.checkCephConnection(cluster);
          cephClusterService.keyringCandidates(cluster)
          .$promise
          .then(function (res) {
            self.clustersKeyringCandidates[cluster.fsid] = res;
          });
        });
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
        }, animationTimeout);
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
        }, animationTimeout);
      }
    };

    self.rgwManagedByDeepSeaChangeHandler = function () {
      if (self.model.rgw.managed_by_deepsea) {
        self.model.rgw = angular.copy(self.rgwDeepSeaSettings);
      }
      self.checkRgwConnection();
    };

    var isAllGrafanaPropsDefined = function (grafana) {
      return angular.isDefined(grafana.host) &&
          angular.isDefined(grafana.port) &&
          angular.isDefined(grafana.username) &&
          angular.isDefined(grafana.password) &&
          angular.isDefined(grafana.use_ssl);
    };

    var checkGrafanaConnectionTimeout;
    self.checkGrafanaConnection = function () {
      self.grafanaConnectionStatus = undefined;
      if (checkGrafanaConnectionTimeout) {
        $timeout.cancel(checkGrafanaConnectionTimeout);
      }
      if (isAllGrafanaPropsDefined(self.model.grafana)) {
        self.grafanaConnectionStatus = {
          loading: true
        };
        checkGrafanaConnectionTimeout = $timeout(function () {
          settingsFormService.checkGrafanaConnection(self.model.grafana)
            .$promise
            .then(function (res) {
              self.grafanaConnectionStatus = res;
            })
            .catch(function () {
              self.grafanaConnectionStatus = undefined;
            });
        }, animationTimeout);
      }
    };

    var isAllCephPropsDefined = function (ceph) {
      return angular.isDefined(ceph.config_file_path) &&
          angular.isDefined(ceph.keyring_file_path) &&
          angular.isDefined(ceph.keyring_user);
    };

    var checkCephConnectionTimeout;
    self.checkCephConnection = function (ceph) {
      self.cephConnectionStatus = undefined;
      if (checkCephConnectionTimeout) {
        $timeout.cancel(checkCephConnectionTimeout);
      }
      if (isAllCephPropsDefined(ceph)) {
        self.cephConnectionStatus = {
          loading: true
        };
        checkCephConnectionTimeout = $timeout(function () {
          settingsFormService.checkCephConnection(ceph)
            .$promise
            .then(function (res) {
              self.cephConnectionStatus = res;
            })
            .catch(function () {
              self.cephConnectionStatus = undefined;
            });
        }, animationTimeout);
      }
    };

    self.getKeyringFileTypeahead = function (fsid) {
      var clusterKeyringCandidates = self.clustersKeyringCandidates[fsid];
      if (angular.isDefined(clusterKeyringCandidates)) {
        return clusterKeyringCandidates.reduce(function (result, item) {
          return result.concat(item["file-path"]);
        }, []);
      }
      return [];
    };

    self.getKeyringUserTypeahead = function (fsid, keyringFile) {
      var clusterKeyringCandidates = self.clustersKeyringCandidates[fsid];
      if (angular.isDefined(clusterKeyringCandidates)) {
        return clusterKeyringCandidates.reduce(function (result, item) {
          if (item["file-path"] === keyringFile) {
            return result.concat(item["user-names"]);
          } else {
            return result;
          }
        }, []);
      }
      return [];
    };

    self.saveAction = function () {
      self.settingsError = "";
      self.clustersErrors = {};
      var hasErros = false;
      var promises = [];
      var promise = settingsFormService.save(self.model)
        .$promise
        .catch(function (error) {
          error.preventDefault();
          self.settingsError = error.message;
          hasErros = true;
        });
      promises.push(promise);

      angular.forEach(self.clusters.results, function (cluster) {
        var promise = cephClusterService.update(cluster)
        .$promise
        .catch(function (error) {
          error.preventDefault();
          self.clustersErrors[cluster.fsid] = error.message;
          hasErros = true;
        });
        promises.push(promise);
      });

      $q.all(promises)
      .then(function () {
        if (!hasErros) {
          Notification.success({
            msg: "Settings has been saved successfully"
          });
        } else {
          Notification.warning({
            title: "Some settings were not saved",
            msg: "One or more settings were not saved, see inline error messages for details"
          });
        }
        $scope.settingsForm.$submitted = false;
        $scope.settingsForm.$dirty = false;
      });

    };

  }
});
