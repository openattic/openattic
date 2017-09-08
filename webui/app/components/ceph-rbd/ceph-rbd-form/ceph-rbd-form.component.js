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
          checked: false,
          disabled: false
        },
        "layering": {
          checked: false,
          disabled: false
        },
        "stripingv2": {
          checked: false,
          disabled: true
        },
        "exclusive-lock": {
          checked: false,
          disabled: false
        },
        "object-map": {
          checked: false,
          disabled: true
        },
        "journaling": {
          checked: false,
          disabled: true
        },
        "fast-diff": {
          checked: false,
          disabled: true
        }
      },
      defaultFeatures: true,
      obj_num: 1,
      obj_size: "4 MiB",
      size: "",
      expert: false
    };

    self.pools = {
      replicated: [],
      erasure: []
    };
    self.clusters = undefined;

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

    var featureFormUpdate = function (key) {
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

    self.watchDataFeatures = function (key) {
      var defaults = self.data.defaultFeatures;
      if (!defaults) {
        if (key) {
          featureFormUpdate(key);
        }
        var noneSelected = Object.keys(self.data.features).every(function (feature) {
          return !self.data.features[feature].checked;
        });
        $scope.rbdForm.$setValidity("noFeatureSelected", !noneSelected);
      } else {
        $scope.rbdForm.$setValidity("noFeatureSelected", defaults);
      }
    };

    self.defaultFeatures = function () {
      angular.copy(self.defaultFeatureValues, self.data.features);
    };

    self.updateObjSize = function (jump) {
      var size = self.data.obj_size;
      if (size.match(/[+-]+/)) {
        size = size.replace(/[+-]+/, "");
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
      self.rbd.obj_size = size;
      self.data.obj_size = $filter("bytes")(size);
    };

    self.objSizeChange = function (event) {
      if (event.keyCode === 38 || event.keyCode === 40) { // 38 == up arrow && 40 == down arrow
        self.updateObjSize(39 - event.keyCode);
      } else if (event.keyCode === 187 || event.keyCode === 189) {
        self.updateObjSize(188 - event.keyCode);
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
        if (self.fsid) {
          self.clusters.some(function (cluster) {
            if (cluster.fsid === self.fsid) {
              self.data.cluster = cluster;
              self.watchDataCluster();
            }
          });
        }
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
      getReplicatedPools();
      getEcOverwritesPools();
    };

    var getReplicatedPools = function () {
      self.waitingPoolMsg = "Retrieving pool list...";
      cephPoolsService.get({
        fsid: self.fsid,
        type: "replicated"
      })
        .$promise
        .then(function (res) {
          self.poolFailure = false;
          $scope.rbdForm.$setValidity("poolLoading", true);
          angular.forEach(res.results, addPoolAttributes);
          if (res.count === 1 && !self.data.pool) {
            self.data.pool = res.results[0];
          }
          self.pools.replicated = res.results;
          if (res.count === 0) {
            self.waitingPoolMsg = "No suitable pool aviable.";
            Notification.warning({
              title: self.waitingPoolMsg,
              msg: "You can't create any RBDs in the selected cluster."
            });
          } else {
            self.waitingPoolMsg = "-- Select a pool --";
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

    var getEcOverwritesPools = function () {
      cephPoolsService.get({
        fsid: self.fsid,
        flags: "ec_overwrites"
      })
        .$promise
        .then(function (res) {
          angular.forEach(res.results, addPoolAttributes);
          self.pools.erasure = res.results;
        });
    };

    var addPoolAttributes = function (pool) {
      pool.oaUsed = $filter("number")(pool.num_bytes / pool.max_avail * 100, 2);
      pool.oaUnused = 100 - pool.oaUsed;
      pool.oaFree = pool.max_avail - pool.num_bytes;
      pool.oaMaxFree = parseInt((pool.max_avail - pool.num_bytes) / Math.pow(2, 20), 10);
      pool.oaFreeText = $filter("bytes")(pool.oaFree);
    };

    self.getDataPools = function () {
      if (!self.data.pool) {
        return [];
      }
      return self.pools.erasure.concat(self.pools.replicated.filter(function (pool) {
        return self.data.pool.id !== pool.id;
      }));
    };

    self.watchDataCluster = function () {
      if (self.data.cluster) {
        self.fsid = self.data.cluster.fsid;
        self.getCephPools();
      }
    };

    self.submitAction = function (rbdForm) {
      if (rbdForm.$valid) {
        if (!self.data.defaultFeatures) {
          var features = [];
          for (var feature in self.data.features) {
            if (self.data.features[feature].checked) {
              features.push(feature);
            }
          }
          self.rbd.features = features;
        }
        self.rbd.pool = self.data.pool.id;
        if (self.data.useDataPool) {
          self.rbd.data_pool = self.data.dataPool.id;
        }
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
