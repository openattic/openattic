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

var app = angular.module("openattic.cephRbd");
app.component("cephRbdForm", {
  templateUrl: "components/ceph-rbd/ceph-rbd-form/ceph-rbd-form.component.html",
  bindings: {},
  controller: function ($scope, $state, $stateParams, cephRbdService,
      cephPoolsService, SizeParserService, $filter, Notification,
      cephClusterService, cephRbdFeatures) {
    var self = this;

    self.submitted = false;
    self.rbd = {
      name: "",
      size: 0,
      pool: -1,
      obj_size: 4194304
    };

    self.data = {
      cluster: null,
      pool: null,
      features: {
        "deep-flatten": {
          checked: true,
          disabled: false
        },
        "layering": {
          checked: true,
          disabled: false
        },
        "stripingv2": {
          checked: false,
          disabled: true
        },
        "exclusive-lock": {
          checked: true,
          disabled: false
        },
        "object-map": {
          checked: true,
          disabled: false
        },
        "journaling": {
          checked: false,
          disabled: false
        },
        "fast-diff": {
          checked: true,
          disabled: false
        }
      },
      obj_num: 1,
      obj_size: "4 MiB",
      size: "",
      expert: false
    };

    self.pools = {};
    self.clusters = {};

    self.features = cephRbdFeatures;

    self.defaultFeatureValues = {};
    angular.copy(self.data.features, self.defaultFeatureValues);

    var deepBoxCheck = function (key, checked) {
      angular.forEach(self.features, function (details, feature) {
        if (details.requires === key) {
          self.data.features[feature].disabled = !checked;
          if (!checked) {
            self.data.features[feature].checked = checked; // Always.
            self.watchDataFeatures(feature);
            deepBoxCheck(feature, checked);
          }
        }
        if (details.excludes === key) {
          self.data.features[feature].disabled = checked;
        }
      });
    };

    self.watchDataFeatures = function (key) {
      var checked = self.data.features[key].checked;
      if (checked) {
        var required = self.features[key].requires;
        var excluded = self.features[key].excludes;
        if (excluded && self.data.features[excluded].checked || required && !self.data.features[required].checked) {
          self.data.features[key].checked = false;
          return;
        }
      }

      deepBoxCheck(key, checked);
    };

    self.defaultFeatures = function () {
      angular.copy(self.defaultFeatureValues, self.data.features);
    };

    self.updateObjSize = function (size, old, jump) {
      if (size.match(/[+-]+/)) {
        size = size.replace(/[+-]+/, "");
      }
      if (size === old) {
        self.data.obj_size = size;
        return;
      }
      size = SizeParserService.parseInt(size, "b", "k"); //default input size is KB
      var power = 0;
      if (size !== null && size !== 0) {
        power = Math.round(Math.log(size) / Math.log(2));
        if (angular.isNumber(jump)) {
          power += jump;
        }
      }
      if (power < 12) {
        size = Math.pow(2, 12); // 1 << 12; Set size to minimum of 4 KB.
      } else if (power > 25) {
        size = Math.pow(2, 25); // 1 << 25; Set size to maximum of 32 MB.
      } else {
        size = Math.pow(2, power); // 1 << power; Set size the nearest accurate size.
      }
      if (self.rbd.obj_size !== size) {
        self.rbd.obj_size = size;
      }
      self.data.obj_size = $filter("bytes")(size);
    };

    self.objSizeChange = function (event) {
      if (event.keyCode === 38 || event.keyCode === 40) { // 38 == up arrow && 40 == down arrow
        self.updateObjSize(self.data.obj_size, null, 39 - event.keyCode);
      } else if (event.keyCode === 187 || event.keyCode === 189) {
        self.updateObjSize(self.data.obj_size, null, 188 - event.keyCode);
      }
    };

    self.watchDataSize = function () {
      var size = self.data.size;
      if (size === "") {
        return;
      }

      size = SizeParserService.parseInt(size, "b");
      var objNum = parseInt(size / self.data.obj_size, 10);
      if (objNum < 1) {
        self.data.size = $filter("bytes")(self.data.obj_size);
      } else {
        self.data.size = $filter("bytes")(size);
      }
    };

    self.watchDataPool = function () {
      if (!self.pool) {
        self.data.expert = false;
      }
    };

    var goToListView = function () {
      $state.go("cephRbds");
    };

    self.fsid = $stateParams.fsid;

    self.waitingClusterMsg = "Retrieving cluster list...";
    cephClusterService.get()
      .$promise
      .then(function (res) {
        self.clusters = res.results;
        self.waitingClusterMsg = "-- Select a cluster --";
        self.clusters.forEach(function (cluster) {
          if (cluster.fsid === self.fsid) {
            self.data.cluster = cluster;
            self.watchDataCluster();
          }
        });
        if (!self.data.cluster) {
          if (res.count > 0) {
            self.data.cluster = res.results[0];
            self.watchDataCluster();
          } else {
            self.waitingClusterMsg = "No cluster avialable.";
            Notification.warning({
              title: self.waitingClusterMsg,
              msg: "You can't create any RBDs with your configuration."
            });
          }
        }
        self.data.pools = null;
      })
      .catch(function (clusterError) {
        if (!self.clusterFailure) {
          self.clusterFailure = true;
          self.clusterFailureTitle = clusterError.status + ": " + clusterError.statusText.toLowerCase();
          self.clusterFailureError = clusterError;
          self.waitingClusterMsg = "Error: Cluster couldn't be loaded!";
          $scope.rbdForm.$setValidity("clusterLoading", false);
        }
      });

    self.waitingPoolMsg = "Select a cluster first";
    self.getCephPools = function () {
      self.waitingPoolMsg = "Retrieving pool list...";
      cephPoolsService.get({
        fsid: self.fsid,
        type: "replicated"
      })
        .$promise
        .then(function (res) {
          self.poolFailure = false;
          $scope.rbdForm.$setValidity("poolLoading", true);
          res.results.forEach(function (pool) {
            self.poolFailure = false;
            pool.oaUsed = $filter("number")(pool.num_bytes / pool.max_avail * 100, 2);
            pool.oaUnused = 100 - pool.oaUsed;
            pool.oaFree = pool.max_avail - pool.num_bytes;
            //pool.oaMaxFree = (pool.max_avail - pool.num_bytes) >> 20; // Did not work, don't know why.
            pool.oaMaxFree = parseInt((pool.max_avail - pool.num_bytes) / Math.pow(2, 20), 10);
            pool.oaFreeText = $filter("bytes")(pool.oaFree);
            if (pool.name === "rbd") {
              self.data.pool = pool;
              self.watchDataPool();
            }
          });
          self.pools = res.results;
          self.waitingPoolMsg = "-- Select a pool --";
          if (!self.data.pool) {
            if (res.count > 0 && !self.data.pool) {
              self.data.pool = res.results[0];
              self.watchDataPool();
            } else {
              self.waitingPoolMsg = "No pool aviable.";
              Notification.warning({
                title: self.waitingPoolMsg,
                msg: "You can't create any RBDs in the selected cluster."
              });
            }
          }
        })
        .catch(function (poolError) {
          if (!self.poolFailure) {
            self.poolFailure = true;
            self.poolFailureTitle = poolError.status + ": " + poolError.statusText.toLowerCase();
            self.poolFailureError = poolError;
            $scope.rbdForm.$setValidity("poolLoading", false);
            self.waitingPoolMsg = "Error: List couldn't be loaded!";
          }
        });
    };

    self.watchDataCluster = function () {
      if (self.data.cluster) {
        self.fsid = self.data.cluster.fsid;
        self.getCephPools();
      }
    };

    self.submitAction = function (rbdForm) {
      if (rbdForm.$valid) {
        if (self.data.expert) {
          var features = [];
          for (var feature in self.data.features) {
            if (self.data.features[feature].checked) {
              features.push(feature);
            }
          }
          self.rbd.features = features;
        }
        self.rbd.pool = self.data.pool.id;
        self.rbd.fsid = self.fsid;
        self.rbd.size = SizeParserService.parseInt(self.data.size, "b");
        self.submitted = true;
        cephRbdService.save(self.rbd)
          .$promise
          .then(function (res) {
            self.rbd = res;
            goToListView();
          }, function (error) {
            $scope.rbdForm.$submitted = false;
            if (error.status === 400 && error.data.size) {
              var size = error.data.size[0].match(/[0-9]+/)[0];
              Notification.error({
                title: "RBD creation error " + error.status,
                msg: "Chosen RBD size is too big. Choose a size lower than " + $filter("bytes")(size) + "."
              }, error);
            }
          });
      }
    };

    self.cancelAction = function () {
      goToListView();
    };
  }
});
