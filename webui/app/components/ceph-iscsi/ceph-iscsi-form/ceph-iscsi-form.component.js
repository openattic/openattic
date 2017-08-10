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

var app = angular.module("openattic.cephIscsi");
app.component("cephIscsiForm", {
  templateUrl: "components/ceph-iscsi/ceph-iscsi-form/ceph-iscsi-form.component.html",
  bindings: {
  },
  controller: function ($scope, $state, $timeout, $stateParams, $uibModal,
      cephIscsiTargetAdvangedSettings, cephIscsiImageOptionalSettings, cephIscsiImageAdvangedSettings,
      cephRbdService, cephPoolsService, cephIscsiService, Notification) {
    let self = this;

    self.fsid = $stateParams.fsid;

    self.targetId = $stateParams.targetId;

    self.model = {
      fsid: self.fsid,
      targetId: "",
      targetSettings: {},
      portals: [],
      images: [],
      authentication: {
        hasAuthentication: false,
        user: undefined,
        password: undefined,
        initiators: [],
        hasMutualAuthentication: false,
        enabledMutualAuthentication: true,
        mutualUser: undefined,
        mutualPassword: undefined,
        hasDiscoveryAuthentication: false,
        enabledDiscoveryAuthentication: true,
        discoveryUser: undefined,
        discoveryPassword: undefined,
        hasDiscoveryMutualAuthentication: false,
        enabledDiscoveryMutualAuthentication: true,
        discoveryMutualUser: undefined,
        discoveryMutualPassword: undefined
      },
      originalTargetId: null
    };

    var generateTargetId = function () {
      return "iqn.1996-10.com.suse:" + Date.now();
    };

    var hasLunId = function (model) {
      return model.images.some(function (image) {
        return angular.isDefined(image.settings.lun);
      });
    };

    var initLunId = function (model) {
      if (!hasLunId(model)) {
        var i = 0;
        angular.forEach(model.images, function (image) {
          image.settings.lun = i;
          i++;
        });
      }
    };

    // Add new iSCSI target
    if (angular.isUndefined($stateParams.targetId)) {
      self.model.targetId = generateTargetId();

      // Edit existing iSCSI target
    } else {
      cephIscsiService
        .get({
          fsid: self.fsid,
          targetId: $stateParams.targetId
        })
        .$promise
        .then(function (res) {
          self.model = res;
          self.model.fsid = self.fsid;
          var auth = self.model.authentication;
          if (!auth.hasMutualAuthentication) {
            auth.enabledMutualAuthentication = true;
          }
          if (!auth.hasDiscoveryAuthentication) {
            auth.enabledDiscoveryAuthentication = true;
          }
          if (!auth.hasDiscoveryMutualAuthentication) {
            auth.enabledDiscoveryMutualAuthentication = true;
          }
          initLunId(self.model);
          if ($state.current.name === "cephIscsi-clone") {
            self.model.targetId = generateTargetId();
            self.model.originalTargetId = null;
          } else {
            self.model.originalTargetId = angular.copy(self.model.targetId);
          }
        })
        .catch(function (error) {
          self.error = error;
        });
    }

    self.cephIscsiTargetAdvangedSettings = cephIscsiTargetAdvangedSettings;

    self.openTargetSettingsModal = function () {
      $uibModal.open({
        windowTemplateUrl: "templates/messagebox.html",
        component: "cephIscsiFormTargetSettingsModal",
        resolve: {
          model: function () {
            return self.model;
          }
        }
      });
    };

    self.allPortals = [];
    cephIscsiService.interfaces({
      fsid: self.fsid
    })
    .$promise
    .then(function (portalsFromServer) {
      angular.forEach(portalsFromServer, function (portalItem) {
        angular.forEach(portalItem.interfaces, function (interfaceItem) {
          self.allPortals.push({
            hostname: portalItem.hostname,
            interface: interfaceItem
          });
        });
      });
    });

    var containsPortalInModel = function (portal) {
      return self.model.portals.some(function (currentPortal) {
        return portal.hostname === currentPortal.hostname && portal.interface === currentPortal.interface;
      });
    };

    var notContainsPortalInModel = function (portal) {
      return !containsPortalInModel(portal);
    };

    self.availablePortals = function () {
      return self.allPortals.filter(notContainsPortalInModel);
    };

    self.addPortalAction = function (portal) {
      self.model.portals.push(portal);
    };

    self.removePortal = function (index) {
      self.model.portals.splice(index, 1);
    };

    self.unsupportedRbdFeatures = [
      {
        name: "Deep flatten",
        value: "deep-flatten"
      },
      {
        name: "Exclusive lock",
        value: "exclusive-lock"
      },
      {
        name: "Object map",
        value: "object-map"
      },
      {
        name: "Journaling",
        value: "journaling"
      },
      {
        name: "Fast diff",
        value: "fast-diff"
      },
      {
        name: "Data pool",
        value: "data-pool"
      }
    ];

    var containsUnsupportedFeature = function (features) {
      return features.some(function (feature) {
        return self.unsupportedRbdFeatures
            .findIndex(function (element) {
              return element.value === feature;
            }) !== -1;
      });
    };

    self.allImages = [];
    cephRbdService.get({
      fsid: self.fsid
    })
      .$promise
      .then(function (rbds) {
        cephPoolsService.get({
          fsid: self.fsid
        }).$promise.then(function (pools) {
          angular.forEach(rbds.results, function (rbd) {
            pools.results.some(function (pool) {
              if (pool.id === rbd.pool) {
                self.allImages.push({
                  name: rbd.name,
                  pool: pool.name,
                  hasUnsupportedFeature: containsUnsupportedFeature(rbd.features),
                  settings: {}
                });
                return true;
              }
            });
          });
        });
      });

    self.allIscsiImageSettings = cephIscsiImageOptionalSettings.concat(cephIscsiImageAdvangedSettings);

    var containsImageInModel = function (image) {
      return self.model.images.some(function (currentImage) {
        return image.name === currentImage.name && image.pool === currentImage.pool;
      });
    };

    var notContainsImageInModel = function (image) {
      return !containsImageInModel(image);
    };

    self.availableImages = function () {
      return self.allImages.filter(notContainsImageInModel);
    };

    var nextLunId = function () {
      return self.model.images.reduce(function (nextLunId, currImage) {
        return currImage.settings.lun >= nextLunId ? currImage.settings.lun + 1 : nextLunId;
      }, 0);
    };

    self.addImageAction = function (image) {
      var newImage = angular.copy(image);
      newImage.settings.lun = nextLunId();
      self.model.images.push(newImage);
    };

    self.removeImage = function (index) {
      self.model.images.splice(index, 1);
    };

    self.openImageSettingsModal = function (selectedImage) {
      $uibModal.open({
        windowTemplateUrl: "templates/messagebox.html",
        component: "cephIscsiFormImageSettingsModal",
        resolve: {
          image: function () {
            return selectedImage;
          }
        }
      });
    };

    self.addInitiator = function () {
      self.model.authentication.initiators.push("");
      $timeout(function () {
        var initiatorsInputs = jQuery("#initiators input");
        initiatorsInputs[initiatorsInputs.length - 1].focus();
      });
    };

    self.removeInitiator = function (index) {
      self.model.authentication.initiators.splice(index, 1);
    };

    self.buildRequest = function () {
      var requestModel = angular.copy(self.model);
      var auth = requestModel.authentication;
      if (!auth.hasAuthentication) {
        delete auth.user;
        delete auth.password;
        auth.initiators = [];
        delete auth.enabledMutualAuthentication;
        delete auth.mutualUser;
        delete auth.mutualPassword;
        delete auth.enabledDiscoveryAuthentication;
        delete auth.discoveryUser;
        delete auth.discoveryPassword;
        delete auth.enabledDiscoveryMutualAuthentication;
        delete auth.discoveryMutualUser;
        delete auth.discoveryMutualPassword;
      }
      if (!auth.hasMutualAuthentication) {
        delete auth.enabledMutualAuthentication;
        delete auth.mutualUser;
        delete auth.mutualPassword;
      }
      if (!auth.hasDiscoveryAuthentication) {
        delete auth.enabledDiscoveryAuthentication;
        delete auth.discoveryUser;
        delete auth.discoveryPassword;
        delete auth.enabledDiscoveryMutualAuthentication;
        delete auth.discoveryMutualUser;
        delete auth.discoveryMutualPassword;
      }
      if (!auth.hasDiscoveryMutualAuthentication) {
        delete auth.enabledDiscoveryMutualAuthentication;
        delete auth.discoveryMutualUser;
        delete auth.discoveryMutualPassword;
      }
      return requestModel;
    };

    self.submitAction = function () {
      var requestModel = self.buildRequest();
      if (requestModel.originalTargetId !== null) {
        requestModel.newTargetId = requestModel.targetId;
        requestModel.targetId = requestModel.originalTargetId;
        cephIscsiService.update(requestModel)
          .$promise
          .then(function () {
            Notification.success({
              msg: "Target has been edited"
            });
            $state.go("cephIscsi");
          }, function () {
            $scope.iscsiForm.$submitted = false;
          });
      } else {
        requestModel.newTargetId = null;
        cephIscsiService.save(requestModel)
          .$promise
          .then(function () {
            Notification.success({
              msg: "Target has been added"
            });
            $state.go("cephIscsi");
          }, function () {
            $scope.iscsiForm.$submitted = false;
          });
      }
    };

    self.cancelAction = function () {
      $state.go("cephIscsi");
    };

  }
});
