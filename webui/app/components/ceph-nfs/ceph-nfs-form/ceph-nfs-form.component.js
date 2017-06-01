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

var app = angular.module("openattic.cephNfs");
app.component("cephNfsForm", {
  templateUrl: "components/ceph-nfs/ceph-nfs-form/ceph-nfs-form.component.html",
  bindings: {
  },
  controller: function ($scope, $state, $stateParams, Notification, cephNfsAccessType, cephNfsSquash, cephNfsFsal,
      cephNfsService, cephNfsFormService, cephRgwUserService) {
    var self = this;

    self.cephNfsAccessType = cephNfsAccessType;
    self.cephNfsSquash = cephNfsSquash;

    self.model = {
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

    self.isEditMode = function () {
      return angular.isDefined($stateParams.host) && angular.isDefined($stateParams.exportId);
    };

    if (self.isEditMode()) {
      cephNfsService
      .get({
        fsid: $stateParams.fsid,
        host: $stateParams.host,
        exportId: $stateParams.exportId
      })
      .$promise
      .then(function (res) {
        self.model = res;
        self.model.fsid = $stateParams.fsid;
        if (self.model.fsal === "RGW") {
          self.model.bucket = self.model.path;
          delete self.model.path;
        }
        if (self.model.tag !== generateTag()) {
          $scope.nfsForm.tag.$dirty = true;
        }
        if (self.model.pseudo !== generatePseudo()) {
          $scope.nfsForm.pseudo.$dirty = true;
        }
        self.model.protocolNfsv3 = self.model.protocols.indexOf("NFSv3") !== -1;
        self.model.protocolNfsv4 = self.model.protocols.indexOf("NFSv4") !== -1;
        delete self.model.protocols;
        self.model.transportTCP = self.model.transports.indexOf("TCP") !== -1;
        self.model.transportUDP = self.model.transports.indexOf("UDP") !== -1;
        delete self.model.transports;
        angular.forEach(self.model.clientBlocks, function (clientBlock) {
          var clientsStr = "";
          angular.forEach(clientBlock.clients, function (client) {
            clientsStr += client + ", ";
          });
          if (clientsStr.length >= 2) {
            clientsStr = clientsStr.substring(0, clientsStr.length - 2);
          }
          clientBlock.clients = clientsStr;
        });
        if ($state.current.name === "cephNfs-clone") {
          delete self.model.id;
          delete self.model.exportId;
        }
      })
      .catch(function (error) {
        self.error = error;
      });
    }

    self.getId = function () {
      if (angular.isDefined(self.model.host) && angular.isDefined(self.model.path)) {
        return self.model.host + ":" + self.model.path;
      }
      return "";
    };

    self.allHosts = [];
    cephNfsService.hosts({
      fsid: $stateParams.fsid
    })
    .$promise
    .then(function (res) {
      self.allHosts = res.hosts;
    });

    self.allRgwUsers = [];
    self.allFsals = [];
    cephNfsService.fsals({
      fsid: $stateParams.fsid
    })
    .$promise
    .then(function (res) {
      angular.forEach(res.fsals, function (fsal) {
        var fsalItem = cephNfsFsal.find(function (currentFsalItem) {
          if (fsal === currentFsalItem.value) {
            return currentFsalItem;
          }
        });
        if (angular.isDefined(fsalItem)) {
          self.allFsals.push(fsalItem);
          if (fsalItem.value === "RGW") {
            cephRgwUserService.filter({
              ordering: "ASC"
            })
            .$promise
            .then(function (res) {
              angular.forEach(res.results, function (user) {
                if (user.suspended === 0) {
                  self.allRgwUsers.push(user.user_id);
                }
              });
            });
          }
        }
      });
      if (self.allFsals.length === 1 && angular.isUndefined(self.model.fsal)) {
        self.model.fsal = self.allFsals[0];
      }
    });

    self.isNewDirectory = false;
    self.getPathTypeahead = function (path, setNewDirectory) {
      var rootDir = "/";
      if (angular.isDefined(path) && path.length > 1 && path[0] === "/") {
        rootDir = path.substring(0, path.lastIndexOf("/") + 1);
      }
      return cephNfsFormService.lsDir({
        fsid: $stateParams.fsid,
        root_dir: rootDir,
        userid: self.model.rgwUserId
      })
      .$promise
      .then(function (res) {
        if (setNewDirectory) {
          self.isNewDirectory = path !== "/" && res.paths.indexOf(path) === -1;
        } else {
          self.isNewDirectory = false;
        }
        return res.paths;
      });
    };

    self.isNewBucket = false;
    self.getBucketTypeahead = function (path, setNewBucket) {
      if (angular.isDefined(self.model.rgwUserId) && self.model.rgwUserId !== null) {
        return cephNfsFormService.buckets({
          fsid: $stateParams.fsid,
          userid: self.model.rgwUserId
        })
        .$promise
        .then(function (res) {
          if (setNewBucket) {
            self.isNewBucket = path !== "" && res.buckets.indexOf(path) === -1;
          } else {
            self.isNewBucket = false;
          }
          return res.buckets;
        });
      }
    };

    var generateTag = function () {
      var newTag = self.model.tag;
      if (!$scope.nfsForm.tag.$dirty) {
        newTag = undefined;
        if (self.model.fsal === "RGW") {
          newTag = self.model.bucket;
        }
      }
      return newTag;
    };

    var generatePseudo = function () {
      var newPseudo = self.model.pseudo;
      if (!$scope.nfsForm.pseudo.$dirty) {
        newPseudo = undefined;
        if (self.model.fsal === "CEPH") {
          newPseudo = "/cephfs";
          if (angular.isDefined(self.model.path)) {
            newPseudo += self.model.path;
          }
        } else if (self.model.fsal === "RGW") {
          if (angular.isDefined(self.model.rgwUserId) && self.model.rgwUserId !== null) {
            newPseudo = "/" + self.model.rgwUserId;
            if (angular.isDefined(self.model.bucket)) {
              newPseudo += "/" + self.model.bucket;
            }
          }
        }
      }
      return newPseudo;
    };

    self.fsalChangeHandler = function () {
      self.model.tag = generateTag();
      self.model.pseudo = generatePseudo();
    };

    self.rgwUserIdChangeHandler = function () {
      self.model.pseudo = generatePseudo();
    };

    self.pathChangeHandler = function () {
      self.model.pseudo = generatePseudo();
    };

    self.bucketChangeHandler = function () {
      self.model.tag = generateTag();
      self.model.pseudo = generatePseudo();
    };

    self.getAccessTypeHelp = function (accessType) {
      var accessTypeItem = cephNfsAccessType.find(function (currentAccessTypeItem) {
        if (accessType === currentAccessTypeItem.value) {
          return currentAccessTypeItem;
        }
      });
      return angular.isDefined(accessTypeItem) ? accessTypeItem.help : "";
    };

    self.buildRequest = function () {
      var requestModel = angular.copy(self.model);
      if (requestModel.fsal === "RGW") {
        requestModel.path = requestModel.bucket;
      }
      if (angular.isUndefined(requestModel.tag) || requestModel.tag === "") {
        requestModel.tag = null;
      }
      requestModel.protocols = [];
      if (requestModel.protocolNfsv3) {
        delete requestModel.protocolNfsv3;
        requestModel.protocols.push("NFSv3");
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
      angular.forEach(requestModel.clientBlocks, function (clientBlock) {
        if (angular.isDefined(clientBlock.clients)) {
          var clients = clientBlock.clients.replace(/\s/g, "");
          clients = "\"" + clients.replace(/,/g, "\",\"") + "\"";
          clientBlock.clients = angular.fromJson("[" + clients + "]");
        } else {
          clientBlock.clients = [];
        }
      });
      return requestModel;
    };

    self.submitAction = function () {
      var requestModel = self.buildRequest();
      // Add
      if (angular.isUndefined(requestModel.id)) {
        cephNfsService.save(requestModel)
        .$promise
        .then(function () {
          Notification.success({
            msg: "NFS export has been added"
          });
          $state.go("cephNfs");
        }, function () {
          $scope.nfsForm.$submitted = false;
        });
      } else { // Edit
        cephNfsService.update(requestModel)
          .$promise
          .then(function () {
            Notification.success({
              msg: "NFS export has been edited"
            });
            $state.go("cephNfs");
          }, function () {
            $scope.nfsForm.$submitted = false;
          });
      }
    };

    self.cancelAction = function () {
      $state.go("cephNfs");
    };
  }
});
