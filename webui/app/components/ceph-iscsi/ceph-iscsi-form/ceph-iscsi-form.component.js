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

class CephIscsiForm {
  constructor ($q, $state, $stateParams, $uibModal,
      cephIscsiTargetAdvangedSettings, cephIscsiImageOptionalSettings,
      cephIscsiImageAdvangedSettings, cephRbdService, cephIscsiRbdUnsupportedFeatures,
      cephIscsiService, Notification) {
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$uibModal = $uibModal;
    this.cephIscsiTargetAdvangedSettings = cephIscsiTargetAdvangedSettings;
    this.cephIscsiService = cephIscsiService;
    this.$q = $q;
    this.cephRbdService = cephRbdService;
    this.cephIscsiService = cephIscsiService;
    this.Notification = Notification;

    this.fsid = $stateParams.fsid;
    this.targetId = $stateParams.targetId;

    this.model = {
      fsid: this.fsid,
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

    this.allPortals = [];
    this.unsupportedRbdFeatures = cephIscsiRbdUnsupportedFeatures;
    this.allImages = [];

    this.allIscsiImageSettings = cephIscsiImageOptionalSettings.concat(cephIscsiImageAdvangedSettings);
  }

  $onInit () {
    let oaPromises = [
      this.cephRbdService.basicData({fsid: this.fsid}).$promise,
      this.cephIscsiService.interfaces({fsid: this.fsid}).$promise
    ];

    // Add new iSCSI target
    if (_.isUndefined(this.$stateParams.targetId)) {
      this.model.targetId = this.generateTargetId();

      // Edit existing iSCSI target
    } else {
      oaPromises.push(this.cephIscsiService
        .get({
          fsid: this.fsid,
          targetId: this.$stateParams.targetId
        }).$promise);
    }

    this.$q.all(oaPromises)
      .then(data => {
        this.resolveRbds(data[0]);
        this.resolvePortals(data[1]);
        if (_.isObjectLike(data[2])) {
          this.resolveModel(data[2]);
        }
        this.formDataIsReady = true;
      })
      .catch((error) => {
        this.error = error;
      });
  }

  generateTargetId () {
    return "iqn.1996-10.com.suse:" + Date.now();
  }

  hasLunId (model) {
    return model.images.some((image) => {
      return _.isNumber(image.settings.lun);
    });
  }

  initLunId (model) {
    if (!this.hasLunId(model)) {
      let i = 0;
      model.images.forEach((image) => {
        image.settings.lun = i;
        i++;
      });
    }
  }

  resolveModel (res) {
    this.model = res;
    this.model.images.forEach((image) => {
      image.toString = () => {
        return image.pool + ": " + image.name;
      };
    });
    this.model.fsid = this.fsid;
    let auth = this.model.authentication;
    if (!auth.hasMutualAuthentication) {
      auth.enabledMutualAuthentication = true;
    }
    if (!auth.hasDiscoveryAuthentication) {
      auth.enabledDiscoveryAuthentication = true;
    }
    if (!auth.hasDiscoveryMutualAuthentication) {
      auth.enabledDiscoveryMutualAuthentication = true;
    }
    this.initLunId(this.model);
    if (this.$state.current.name === "cephIscsi-clone") {
      this.model.targetId = this.generateTargetId();
      this.model.originalTargetId = null;
    } else {
      this.model.originalTargetId = _.cloneDeep(this.model.targetId);
    }
  }

  openTargetSettingsModal () {
    this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephIscsiFormTargetSettingsModal",
      resolve: {
        model: () => {
          return this.model;
        }
      }
    });
  }

  resolvePortals (portalsFromServer) {
    portalsFromServer.forEach((portalItem) => {
      portalItem.interfaces.forEach((interfaceItem) => {
        this.allPortals.push({
          hostname: portalItem.hostname,
          interface: interfaceItem
        });
      });
    });
  }

  containsPortalInModel (portal) {
    return this.model.portals.some((currentPortal) => {
      return portal.hostname === currentPortal.hostname && portal.interface === currentPortal.interface;
    });
  }

  notContainsPortalInModel (portal) {
    return !this.containsPortalInModel(portal);
  }

  availablePortals () {
    return this.allPortals.filter(this.notContainsPortalInModel, this);
  }

  addPortalAction (portal) {
    this.model.portals.push(portal);
  }

  removePortal (index) {
    this.model.portals.splice(index, 1);
  }

  resolveRbds (rbds) {
    rbds.forEach((rbd) => {
      this.allImages.push({
        name: rbd.name,
        pool: rbd.pool,
        settings: {},
        toString: () => {
          return rbd.pool + ": " + rbd.name;
        }
      });
      return true;
    });
  }

  containsImageInModel (image) {
    return this.model.images.some((currentImage) => {
      return image.name === currentImage.name && image.pool === currentImage.pool;
    });
  }

  notContainsImageInModel (image) {
    return !this.containsImageInModel(image);
  }

  availableImages () {
    return this.allImages.filter(this.notContainsImageInModel, this);
  }

  nextLunId () {
    return this.model.images.reduce((nextId, currImage) => {
      return currImage.settings.lun >= nextId ? currImage.settings.lun + 1 : nextId;
    }, 0);
  }

  addImageAction (image) {
    let newImage = _.cloneDeep(image);
    newImage.settings.lun = this.nextLunId();
    this.model.images.push(newImage);
  }

  removeImage (index) {
    this.model.images.splice(index, 1);
  }

  openImageSettingsModal (selectedImage) {
    this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephIscsiFormImageSettingsModal",
      resolve: {
        image: () => {
          return selectedImage;
        }
      }
    });
  }

  addInitiator () {
    this.model.authentication.initiators.push("");
    setTimeout(() => {
      let initiatorsInputs = jQuery("#initiators input");
      initiatorsInputs[initiatorsInputs.length - 1].focus();
    });
  }

  removeInitiator (index) {
    this.model.authentication.initiators.splice(index, 1);
  }

  buildRequest () {
    let requestModel = _.cloneDeep(this.model);
    let auth = requestModel.authentication;
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
      auth.hasDiscoveryMutualAuthentication = false;
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
  }

  addRBD () {
    this.$state.go("cephRbds-add", {
      fsid: this.fsid,
      fromState: "cephIscsi-add"
    });
  }

  submitAction () {
    let requestModel = this.buildRequest();
    if (requestModel.originalTargetId !== null) {
      requestModel.newTargetId = requestModel.targetId;
      requestModel.targetId = requestModel.originalTargetId;
      this.cephIscsiService.update(requestModel)
        .$promise
        .then(() => {
          this.$state.go("cephIscsi");
        }, () => {
          this.iscsiForm.$submitted = false;
        });
    } else {
      requestModel.newTargetId = null;
      this.cephIscsiService.save(requestModel)
        .$promise
        .then(() => {
          this.$state.go("cephIscsi");
        }, () => {
          this.iscsiForm.$submitted = false;
        });
    }
  }

  cancelAction () {
    this.$state.go("cephIscsi");
  }

}

export default {
  template: require("./ceph-iscsi-form.component.html"),
  controller: CephIscsiForm
};
