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
app.controller("CephIscsiFormCtrl", function ($scope, $state, $timeout, $stateParams, $uibModal,
    CEPH_ISCSI_TARGET_ADVANCED_SETTINGS, CEPH_ISCSI_IMAGE_OPTIONAL_SETTINGS, CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS,
    cephRbdService, cephPoolsService, cephIscsiService, Notification) {

  $scope.fsid = $stateParams.fsid;

  $scope.targetId = $stateParams.targetId;

  $scope.model = {
    fsid: $scope.fsid,
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
    return "iqn.1996-04.de.suse:" + Date.now();
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
    $scope.model.targetId = generateTargetId();

  // Edit existing iSCSI target
  } else {
    cephIscsiService
      .get({
        fsid: $scope.fsid,
        targetId: $stateParams.targetId
      })
      .$promise
      .then(function (res) {
        $scope.model = res;
        $scope.model.fsid = $scope.fsid;
        var auth = $scope.model.authentication;
        if (!auth.hasMutualAuthentication) {
          auth.enabledMutualAuthentication = true;
        }
        if (!auth.hasDiscoveryAuthentication) {
          auth.enabledDiscoveryAuthentication = true;
        }
        if (!auth.hasDiscoveryMutualAuthentication) {
          auth.enabledDiscoveryMutualAuthentication = true;
        }
        initLunId($scope.model);
        if ($state.current.name === "cephIscsi-clone") {
          $scope.model.targetId = generateTargetId();
          $scope.model.originalTargetId = null;
        } else {
          $scope.model.originalTargetId = angular.copy($scope.model.targetId);
        }
      })
      .catch(function (error) {
        $scope.error = error;
      });
  }

  $scope.CEPH_ISCSI_TARGET_ADVANCED_SETTINGS = CEPH_ISCSI_TARGET_ADVANCED_SETTINGS;

  $scope.openTargetSettingsModal = function () {
    $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "components/ceph-iscsi/templates/target-settings-modal.html",
      controller: "CephIscsiTargetSettingsModalCtrl",
      resolve: {
        model: function () {
          return $scope.model;
        }
      }
    });
  };

  $scope.allPortals = [];
  cephIscsiService.interfaces({
      fsid: $scope.fsid
    })
    .$promise
    .then(function (portalsFromServer) {
      angular.forEach(portalsFromServer, function (portalItem) {
        angular.forEach(portalItem.interfaces, function (interfaceItem) {
          $scope.allPortals.push({
            hostname: portalItem.hostname,
            interface: interfaceItem
          });
        });
      });
    });

  var containsPortalInModel = function (portal) {
    return $scope.model.portals.some(function (currentPortal) {
      return portal.hostname === currentPortal.hostname && portal.interface === currentPortal.interface;
    });
  };

  var notContainsPortalInModel = function (portal) {
    return !containsPortalInModel(portal);
  };

  $scope.availablePortals = function () {
    return $scope.allPortals.filter(notContainsPortalInModel);
  };

  $scope.addPortalAction = function (portal) {
    $scope.model.portals.push(portal);
  };

  $scope.removePortal = function (index) {
    $scope.model.portals.splice(index, 1);
  };

  $scope.unsupportedRbdFeatures = [
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
      return $scope.unsupportedRbdFeatures
        .findIndex(function (element) {
          return element.value === feature;
        }) !== -1;
    });
  };

  $scope.allImages = [];
  cephRbdService.get({
      fsid: $scope.fsid
    })
    .$promise
    .then(function (rbds) {
      cephPoolsService.get({
        fsid: $scope.fsid
      }).$promise.then(function (pools) {
        angular.forEach(rbds.results, function (rbd) {
          pools.results.some(function (pool) {
            if (pool.id === rbd.pool) {
              $scope.allImages.push({
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

  $scope.ALL_ISCSI_IMAGE_SETTINGS = CEPH_ISCSI_IMAGE_OPTIONAL_SETTINGS.concat(CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS);

  var containsImageInModel = function (image) {
    return $scope.model.images.some(function (currentImage) {
      return image.name === currentImage.name && image.pool === currentImage.pool;
    });
  };

  var notContainsImageInModel = function (image) {
    return !containsImageInModel(image);
  };

  $scope.availableImages = function () {
    return $scope.allImages.filter(notContainsImageInModel);
  };

  var nextLunId = function () {
    return $scope.model.images.reduce(function (nextLunId, currImage) {
      return currImage.settings.lun >= nextLunId ? currImage.settings.lun + 1 : nextLunId;
    }, 0);
  };

  $scope.addImageAction = function (image) {
    var newImage = angular.copy(image);
    newImage.settings.lun = nextLunId();
    $scope.model.images.push(newImage);
  };

  $scope.removeImage = function (index) {
    $scope.model.images.splice(index, 1);
  };

  $scope.openImageSettingsModal = function (selectedImage) {
    $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "components/ceph-iscsi/templates/image-settings-modal.html",
      controller: "CephIscsiImageSettingsModalCtrl",
      resolve: {
        image: function () {
          return selectedImage;
        }
      }
    });
  };

  $scope.addInitiator = function () {
    $scope.model.authentication.initiators.push("");
    $timeout(function () {
      var initiatorsInputs = jQuery("#initiators input");
      initiatorsInputs[initiatorsInputs.length - 1].focus();
    });
  };

  $scope.removeInitiator = function (index) {
    $scope.model.authentication.initiators.splice(index, 1);
  };

  $scope.buildRequest = function () {
    var requestModel = angular.copy($scope.model);
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

  $scope.submitAction = function () {
    var requestModel = $scope.buildRequest();
    if (requestModel.originalTargetId !== null)  {
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

  $scope.cancelAction = function () {
    $state.go("cephIscsi");
  };

});
