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

import _ from "lodash";

class SettingsForm {
  constructor ($state, $q, settingsFormService, cephClusterService,
      hostsService, Notification) {
    this.$q = $q;
    this.$state = $state;
    this.Notification = Notification;
    this.cephClusterService = cephClusterService;
    this.hostsService = hostsService;
    this.settingsFormService = settingsFormService;

    this.animationTimeout = 300;

    this.model = {
      deepsea: {},
      rgw: {},
      grafana: {},
      ceph: {}
    };

    this.clustersKeyringCandidates = {};

    this.defaultRgwDeepseaSettings = {
      managed_by_deepsea: true
    };
    this.rgwDeepseaSettings = _.cloneDeep(this.defaultRgwDeepseaSettings);

    this.managedByDeepSeaEnabled = true;
    this.deepseaConnectionStatus = undefined;
    this.rgwConnectionStatus = undefined;
    this.grafanaConnectionStatus = undefined;
    this.checkDeepSeaConnectionTimeout = undefined;
    this.checkRgwConnectionTimeout = undefined;
    this.checkCephConnectionTimeout = undefined;
    this.checkGrafanaConnectionTimeout = undefined;
  }

  $onInit () {
    this.settingsFormService.get()
      .$promise
      .then((res) => {
        this.model = res;
        if (!this.model.rgw.managed_by_deepsea) {
          this.managedByDeepSeaEnabled = false;
        }
        this.model.ceph.forEach((cluster) => {
          this.checkCephConnection(cluster);
          this.cephClusterService.keyringCandidates(cluster)
            .$promise
            .then((result) => {
              this.clustersKeyringCandidates[cluster.fsid] = result;
            });
        });
        this.checkDeepSeaConnection();
        this.checkGrafanaConnection();
      })
      .catch((error) => {
        this.error = error;
      });
    this.hostsService.current()
      .$promise
      .then((res) => {
        this.openatticVersion = res.oa_version.package.VERSION;
      });
  }

  isAllDeepSeaPropsDefined (deepsea) {
    let isHostDefined = deepsea.host !== undefined && deepsea.host !== "";
    let isPortDefined = deepsea.port !== undefined && deepsea.port !== null;
    let isEauthDefined = deepsea.eauth !== undefined && deepsea.eauth !== null;
    let isUsernameDefined = deepsea.username !== undefined && deepsea.username !== "";
    let isPasswordDefined = deepsea.password !== undefined && deepsea.password !== "";
    let isSharedSecretDefined = deepsea.shared_secret !== undefined && deepsea.shared_secret !== "";
    return isHostDefined && isPortDefined && isEauthDefined &&
      (
        (deepsea.eauth === "auto" && isUsernameDefined && isPasswordDefined) ||
        (deepsea.eauth === "sharedsecret" && isUsernameDefined && isSharedSecretDefined)
      );
  }

  checkDeepSeaConnection () {
    this.deepseaConnectionStatus = undefined;
    if (this.checkDeepSeaConnectionTimeout) {
      clearTimeout(this.checkDeepSeaConnectionTimeout);
    }
    if (this.isAllDeepSeaPropsDefined(this.model.deepsea)) {
      this.deepseaConnectionStatus = {
        loading: true
      };
      this.checkDeepSeaConnectionTimeout = setTimeout(() => {
        this.rgwDeepSeaSettings = _.cloneDeep(this.defaultRgwDeepseaSettings);
        this.settingsFormService.checkDeepSeaConnection(this.model.deepsea)
          .$promise
          .then((res) => {
            this.deepseaConnectionStatus = res;
            if (this.deepseaConnectionStatus.success) {
              this.settingsFormService.getRgwConfiguration(this.model.deepsea)
                .$promise
                .then((result) => {
                  if (result.success) {
                    this.rgwDeepSeaSettings = result.rgw;
                    this.managedByDeepSeaEnabled = true;
                    _.extend(this.rgwDeepSeaSettings, this.defaultRgwDeepseaSettings);
                  } else {
                    this.model.rgw.managed_by_deepsea = false;
                    this.managedByDeepSeaEnabled = false;
                  }
                  this.rgwManagedByDeepSeaChangeHandler();
                });
            } else {
              this.model.rgw.managed_by_deepsea = false;
              this.managedByDeepSeaEnabled = false;
              this.rgwManagedByDeepSeaChangeHandler();
            }
          })
          .catch(() => {
            this.deepseaConnectionStatus = undefined;
          });
      }, this.animationTimeout);
    }
  }

  isAllRgwPropsDefined (rgw) {
    let isHostDefined = rgw.host !== undefined && rgw.host !== "";
    let isPortDefined = rgw.port !== undefined && rgw.port !== null;
    let isAccessKeyDefined = rgw.access_key !== undefined && rgw.access_key !== "";
    let isSecretKeyDefined = rgw.secret_key !== undefined && rgw.secret_key !== "";
    let isUserIdDefined = rgw.user_id !== undefined && rgw.user_id !== "";
    let isUseSSLDefined = rgw.use_ssl !== undefined;
    return isHostDefined && isPortDefined && isAccessKeyDefined &&
      isSecretKeyDefined && isUserIdDefined && isUseSSLDefined;
  }

  checkRgwConnection () {
    this.rgwConnectionStatus = undefined;
    if (this.checkRgwConnectionTimeout) {
      clearTimeout(this.checkRgwConnectionTimeout);
    }
    if (this.isAllRgwPropsDefined(this.model.rgw)) {
      this.rgwConnectionStatus = {
        loading: true
      };
      this.checkRgwConnectionTimeout = setTimeout(() => {
        this.settingsFormService.checkRgwConnection(this.model.rgw)
          .$promise
          .then((res) => {
            this.rgwConnectionStatus = res;
          })
          .catch(() => {
            this.rgwConnectionStatus = undefined;
          });
      }, this.animationTimeout);
    }
  }

  rgwManagedByDeepSeaChangeHandler () {
    if (this.model.rgw.managed_by_deepsea) {
      this.model.rgw = _.cloneDeep(this.rgwDeepSeaSettings);
    }
    this.checkRgwConnection();
  }

  isAllGrafanaPropsDefined (grafana) {
    let isHostDefined = grafana.host !== undefined && grafana.host !== "";
    let isPortDefined = grafana.port !== undefined && grafana.port !== null;
    let isUsernameDefined = grafana.username !== undefined && grafana.username !== "";
    let isPasswordDefined = grafana.password !== undefined && grafana.password !== "";
    let isUseSSLDefined = grafana.password !== grafana.use_ssl;
    return isHostDefined && isPortDefined && isUsernameDefined && isPasswordDefined && isUseSSLDefined;
  }

  checkGrafanaConnection () {
    this.grafanaConnectionStatus = undefined;
    if (this.checkGrafanaConnectionTimeout) {
      clearTimeout(this.checkGrafanaConnectionTimeout);
    }
    if (this.isAllGrafanaPropsDefined(this.model.grafana)) {
      this.grafanaConnectionStatus = {
        loading: true
      };
      this.checkGrafanaConnectionTimeout = setTimeout(() => {
        this.settingsFormService.checkGrafanaConnection(this.model.grafana)
          .$promise
          .then((res) => {
            this.grafanaConnectionStatus = res;
          })
          .catch(() => {
            this.grafanaConnectionStatus = undefined;
          });
      }, this.animationTimeout);
    }
  }

  isAllCephPropsDefined (ceph) {
    let isConfigFilePathDefined = ceph.config_file_path !== undefined && ceph.config_file_path !== "";
    let isKeyringFilePathDefined = ceph.keyring_file_path !== undefined && ceph.keyring_file_path !== "";
    let isKeyringUserDefined = ceph.keyring_user !== undefined && ceph.keyring_user !== "";
    return isConfigFilePathDefined && isKeyringFilePathDefined && isKeyringUserDefined;
  }

  checkCephConnection (ceph) {
    this.cephConnectionStatus = undefined;
    if (this.checkCephConnectionTimeout) {
      clearTimeout(this.checkCephConnectionTimeout);
    }
    if (this.isAllCephPropsDefined(ceph)) {
      this.cephConnectionStatus = {
        loading: true
      };
      this.checkCephConnectionTimeout = setTimeout(() => {
        this.settingsFormService.checkCephConnection(ceph)
          .$promise
          .then((res) => {
            this.cephConnectionStatus = res;
          })
          .catch(() => {
            this.cephConnectionStatus = undefined;
          });
      }, this.animationTimeout);
    }
  }

  getKeyringFileTypeahead (fsid) {
    var clusterKeyringCandidates = this.clustersKeyringCandidates[fsid];
    if (_.isArray(clusterKeyringCandidates)) {
      return clusterKeyringCandidates.reduce((result, item) => {
        return result.concat(item["file-path"]);
      }, []);
    }
    return [];
  }

  getKeyringUserTypeahead (fsid, keyringFile) {
    var clusterKeyringCandidates = this.clustersKeyringCandidates[fsid];
    if (_.isArray(clusterKeyringCandidates)) {
      return clusterKeyringCandidates.reduce((result, item) => {
        if (item["file-path"] === keyringFile) {
          return result.concat(item["user-names"]);
        } else {
          return result;
        }
      }, []);
    }
    return [];
  }

  saveAction () {
    this.settingsFormService.save(this.model)
      .$promise
      .then(() => {
        this.Notification.success({
          msg: "Settings have been saved successfully"
        });
        this.settingsForm.$submitted = false;
        this.settingsForm.$dirty = false;
      }, () => {
        this.settingsForm.$submitted = false;
      });
  }
}

export default {
  template: require("./settings-form.component.html"),
  controller: SettingsForm
};
