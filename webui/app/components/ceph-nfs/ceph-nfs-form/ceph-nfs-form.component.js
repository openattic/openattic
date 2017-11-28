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

class CephNfsForm {

  constructor ($state, $stateParams, $q, cephNfsAccessType, cephNfsSquash,
      cephNfsFsal, cephNfsService, cephNfsFormService, cephRgwUserService) {
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$q = $q;
    this.cephNfsAccessType = cephNfsAccessType;
    this.cephNfsSquash = cephNfsSquash;
    this.cephNfsFsal = cephNfsFsal;
    this.cephNfsService = cephNfsService;
    this.cephNfsFormService = cephNfsFormService;
    this.cephRgwUserService = cephRgwUserService;

    this.model = {
      fsid: $stateParams.fsid,
      id: undefined,
      exportId: undefined,
      host: undefined,
      fsal: undefined,
      rgwUserId: null,
      path: undefined,
      tag: undefined,
      protocolNfsv3: true,
      protocolNfsv4: true,
      pseudo: undefined,
      accessType: "RW",
      squash: "None",
      transportTCP: true,
      transportUDP: true,
      clientBlocks: []
    };

    this.isNewDirectory = false;
    this.isNewBucket = false;

    this.allHosts = [];
    this.allRgwUsers = [];
    this.allFsals = [];
  }

  $onInit () {
    let oaPromises = [
      this.cephNfsService.hosts({fsid: this.$stateParams.fsid}).$promise,
      this.cephNfsService.fsals({fsid: this.$stateParams.fsid}).$promise
    ];

    if (this.isEditMode()) {
      oaPromises.push(this.cephNfsService
        .get({
          fsid: this.$stateParams.fsid,
          host: this.$stateParams.host,
          exportId: this.$stateParams.exportId
        })
        .$promise);
    }

    let resolveModel = (res) => {
      this.model = res;
      this.model.fsid = this.$stateParams.fsid;
      if (this.model.fsal === "RGW") {
        this.model.bucket = this.model.path;
        delete this.model.path;
      }
      if (this.model.tag !== this._generateTag()) {
        this.nfsForm.tag.$dirty = true;
      }
      if (this.model.pseudo !== this._generatePseudo()) {
        this.nfsForm.pseudo.$dirty = true;
      }
      this.model.protocolNfsv3 = this.model.protocols.indexOf("NFSv3") !== -1;
      this.model.protocolNfsv4 = this.model.protocols.indexOf("NFSv4") !== -1;
      delete this.model.protocols;
      this.model.transportTCP = this.model.transports.indexOf("TCP") !== -1;
      this.model.transportUDP = this.model.transports.indexOf("UDP") !== -1;
      delete this.model.transports;
      this.model.clientBlocks.forEach((clientBlock) => {
        let clientsStr = "";
        clientBlock.clients.forEach((client) => {
          clientsStr += client + ", ";
        });
        if (clientsStr.length >= 2) {
          clientsStr = clientsStr.substring(0, clientsStr.length - 2);
        }
        clientBlock.clients = clientsStr;
      });
      if (this.$state.current.name === "cephNfs-clone") {
        delete this.model.id;
        delete this.model.exportId;
      }
    };

    let resolveHosts = (res) => {
      this.allHosts = res.hosts;
      if (_.isArray(this.allHosts) && this.allHosts.length === 1 && _.isUndefined(this.model.host)) {
        this.model.host = this.allHosts[0];
      }
    };

    let resolvefsals = (res) => {
      res.fsals.forEach((fsal) => {
        let fsalItem = this.cephNfsFsal.find((currentFsalItem) => {
          if (fsal === currentFsalItem.value) {
            return currentFsalItem;
          }
        });
        if (_.isObjectLike(fsalItem)) {
          this.allFsals.push(fsalItem);
          if (fsalItem.value === "RGW") {
            this.cephRgwUserService.filter({
              ordering: "ASC"
            })
              .$promise
              .then((result) => {
                result.results.forEach((user) => {
                  if (user.suspended === 0) {
                    this.allRgwUsers.push(user.user_id);
                  }
                });
              });
          }
        }
      });
      if (this.allFsals.length === 1 && _.isUndefined(this.model.fsal)) {
        this.model.fsal = this.allFsals[0];
      }
    };

    this.$q.all(oaPromises)
      .then(data => {
        resolveHosts(data[0]);
        resolvefsals(data[1]);

        if (data[2]) {
          resolveModel(data[2]);
        }
        this.formDataIsReady = true;
      })
      .catch(error => {
        this.error = error;
      });
  }

  isEditMode () {
    return _.isString(this.$stateParams.host) && _.isString(this.$stateParams.exportId);
  }

  getId () {
    if (_.isString(this.model.host) && _.isString(this.model.path)) {
      return this.model.host + ":" + this.model.path;
    }
    return "";
  }

  getPathTypeahead (path, setNewDirectory) {
    let rootDir = "/";
    if (_.isString(path) && path.length > 1 && path[0] === "/") {
      rootDir = path.substring(0, path.lastIndexOf("/") + 1);
    }
    return this.cephNfsFormService.lsDir({
      fsid: this.$stateParams.fsid,
      root_dir: rootDir,
      userid: this.model.rgwUserId
    })
      .$promise
      .then((res) => {
        if (setNewDirectory) {
          this.isNewDirectory = path !== "/" && res.paths.indexOf(path) === -1;
        } else {
          this.isNewDirectory = false;
        }
        return res.paths;
      });
  }

  getBucketTypeahead (path, setNewBucket) {
    if (_.isString(this.model.rgwUserId)) {
      return this.cephNfsFormService.buckets({
        fsid: this.$stateParams.fsid,
        userid: this.model.rgwUserId
      })
        .$promise
        .then((res) => {
          if (setNewBucket) {
            this.isNewBucket = path !== "" && res.buckets.indexOf(path) === -1;
          } else {
            this.isNewBucket = false;
          }
          return res.buckets;
        });
    }
  }

  _generateTag () {
    let newTag = this.model.tag;
    if (!this.nfsForm.tag.$dirty) {
      newTag = undefined;
      if (this.model.fsal === "RGW") {
        newTag = this.model.bucket;
      }
    }
    return newTag;
  }

  _generatePseudo () {
    let newPseudo = this.model.pseudo;
    if (this.nfsForm.pseudo && !this.nfsForm.pseudo.$dirty) {
      newPseudo = undefined;
      if (this.model.fsal === "CEPH") {
        newPseudo = "/cephfs";
        if (_.isString(this.model.path)) {
          newPseudo += this.model.path;
        }
      } else if (this.model.fsal === "RGW") {
        if (_.isString(this.model.rgwUserId)) {
          newPseudo = "/" + this.model.rgwUserId;
          if (_.isString(this.model.bucket)) {
            newPseudo += "/" + this.model.bucket;
          }
        }
      }
    }
    return newPseudo;
  }

  fsalChangeHandler () {
    this.model.tag = this._generateTag();
    this.model.pseudo = this._generatePseudo();
  }

  rgwUserIdChangeHandler () {
    this.model.pseudo = this._generatePseudo();
  }

  pathChangeHandler () {
    this.model.pseudo = this._generatePseudo();
  }

  bucketChangeHandler () {
    this.model.tag = this._generateTag();
    this.model.pseudo = this._generatePseudo();
  }

  getAccessTypeHelp (accessType) {
    let accessTypeItem = this.cephNfsAccessType.find((currentAccessTypeItem) => {
      if (accessType === currentAccessTypeItem.value) {
        return currentAccessTypeItem;
      }
    });
    return _.isObjectLike(accessTypeItem) ? accessTypeItem.help : "";
  }

  _buildRequest () {
    let requestModel = _.cloneDeep(this.model);
    if (requestModel.fsal === "RGW") {
      requestModel.path = requestModel.bucket;
    }
    if (_.isUndefined(requestModel.tag) || requestModel.tag === "") {
      requestModel.tag = null;
    }
    requestModel.protocols = [];
    if (requestModel.protocolNfsv3) {
      delete requestModel.protocolNfsv3;
      requestModel.protocols.push("NFSv3");
    } else {
      requestModel.tag = null;
    }
    if (requestModel.protocolNfsv4) {
      delete requestModel.protocolNfsv4;
      requestModel.protocols.push("NFSv4");
    } else {
      requestModel.pseudo = null;
    }
    requestModel.transports = [];
    if (requestModel.transportTCP) {
      delete requestModel.transportTCP;
      requestModel.transports.push("TCP");
    }
    if (requestModel.transportUDP) {
      delete requestModel.transportUDP;
      requestModel.transports.push("UDP");
    }
    requestModel.clientBlocks.forEach((clientBlock) => {
      if (_.isString(clientBlock.clients)) {
        let clients = clientBlock.clients.replace(/\s/g, "");
        clients = "\"" + clients.replace(/,/g, "\",\"") + "\"";
        clientBlock.clients = JSON.parse("[" + clients + "]");
      } else {
        clientBlock.clients = [];
      }
    });
    return requestModel;
  }

  submitAction () {
    let requestModel = this._buildRequest();
    // Add
    if (_.isUndefined(requestModel.id)) {
      this.cephNfsService.save(requestModel)
        .$promise
        .then(() => {
          this.$state.go("cephNfs");
        }, () => {
          this.nfsForm.$submitted = false;
        });
    } else { // Edit
      this.cephNfsService.update(requestModel)
        .$promise
        .then(() => {
          this.$state.go("cephNfs");
        }, () => {
          this.nfsForm.$submitted = false;
        });
    }
  }

  cancelAction () {
    this.$state.go("cephNfs");
  }
}

export default {
  template: require("./ceph-nfs-form.component.html"),
  bindings: {
  },
  controller: CephNfsForm
};
