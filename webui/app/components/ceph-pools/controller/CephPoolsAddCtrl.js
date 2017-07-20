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

var app = angular.module("openattic.cephPools");
app.controller("CephPoolsAddCtrl", function ($scope, $state, $stateParams,
    $uibModal, Notification, cephOsdService, cephCrushmapService,
    cephClusterService, cephErasureCodeProfilesService, cephPoolsService,
    $filter, SizeParserService) {
  const PG_MIN = 16;
  $scope.pool = {
    name: "",
    pg_num: PG_MIN,
    type: "",
    crush_ruleset: 0,
    size: 3,
    erasure: {
      profile: undefined
    },
    compression_algorithm: "snappy",
    compression_max_blob_size: 0,
    compression_min_blob_size: 0,
    compression_mode: "none",
    compression_required_ratio: 0.875
  };

  $scope.data = {
    cluster: undefined,
    poolTypes: [
      {
        name: "replicated",
        description: "Replicated pool"
      },
      {
        name: "erasure",
        description: "Erasure code pool"
      }
    ],
    profiles: [],
    expert: false,
    ruleset: undefined,
    osdCount: 1,
    flags: {},
    compressionAlgorithms: [{
        name: "none",
        description: "none"
      },
      {
        name: "snappy",
        description: "snappy"
      },
      {
        name: "zlib",
        description: "zlib"
      },
      {
        name: "zstd",
        description: "zstd"
      },
      {
        name: "lz4",
        description: "lz4"
      }
    ],
    compressionModes: [{
        name: "none",
        description: "none"
      },
      {
        name: "force",
        description: "force"
      },
      {
        name: "aggressive",
        description: "aggressive"
      },
      {
        name: "passive",
        description: "passive"
      }
    ],
    compression_min_blob_size: "0 B",
    compression_max_blob_size: "0 B"
  };

  $scope.clusters = undefined;

  var goToListView = function () {
    $state.go("cephPools");
  };

  $scope.fsid = $stateParams.fsid;

  $scope.pgUpdate = function (pgs, jump) {
    pgs = pgs || $scope.pool.pg_num;
    var power =  Math.round(Math.log(pgs) / Math.log(2));
    if (angular.isNumber(jump)) {
      power += jump;
    }
    pgs = Math.pow(2, power); // Set size the nearest accurate size.
    if (pgs < PG_MIN) {
      pgs = PG_MIN;
    }
    $scope.pool.pg_num = pgs;
  };

  $scope.pgSizeChange = function () {
    var pgs = $scope.data.osdCount * 100;
    var type = $scope.pool.type;
    var eprofile = $scope.pool.erasure.profile;
    if (type === "replicated") {
      pgs = pgs / $scope.pool.size;
    } else if (type === "erasure" && eprofile) {
      pgs = pgs / (eprofile.k + eprofile.m);
    }
    $scope.pgUpdate(pgs);
  };

  $scope.pgKeyChange = function (event) {
    if (event.keyCode === 38 || event.keyCode === 40) { // 38 == up arrow && 40 == down arrow
      $scope.pgUpdate(undefined, 39 - event.keyCode);
    } else if (event.keyCode === 187 || event.keyCode === 189) { // 187 == plus sign && 189 == minus sign
      $scope.pgUpdate(undefined, 188 - event.keyCode);
    }
  };

  cephClusterService.get()
    .$promise
    .then(function (clusters) {
      $scope.clusters = clusters.results;
      angular.forEach($scope.clusters, function (cluster) {
        if (cluster.fsid === $scope.fsid) {
          $scope.data.cluster = cluster;
        }
      });
      if (!$scope.data.cluster) {
        if (clusters.count > 0) {
          $scope.data.cluster = $scope.clusters[0];
        } else {
          Notification.warning({
            title: "No cluster available",
            msg: "You can't create any pools with your configuration."
          });
        }
      }
    });

  $scope.$watch("data.cluster", function (cluster) {
    if (cluster) {
      $scope.data.cluster.loaded = false;
      $scope.fsid = cluster.fsid;
      cephClusterService.status({fsid: cluster.fsid})
        .$promise
        .then(function (cluster) {
          $scope.data.osdCount = cluster.osdmap.osdmap.num_osds;
          // Calculation found here: http://docs.ceph.com/docs/master/rados/operations/placement-groups/#data-durability
          $scope.pgSizeChange();
        });
      cephErasureCodeProfilesService.get({fsid: cluster.fsid})
        .$promise
        .then(function (res) {
          $scope.data.profiles = res.results;
          $scope.ecProfileChange();
        });
      cephOsdService.get({
          fsid: cluster.fsid,
          osd_objectstore: "bluestore"
        })
          .$promise
          .then(function (res) {
            $scope.bluestore = res.count > 0;
          });
      cephCrushmapService.get({fsid: cluster.fsid})
        .$promise
        .then(function (res) {
          $scope.data.cluster.rules = {
            replicated: [],
            erasure: []
          };
          /* Confusing types because of:
           * https://bitbucket.org/openattic/openattic/src/2a054091ffb56d69b7ccee9ee7070b5116261d6b/backend/ceph/
           * models.py?at=master&fileviewer=file-view-default#models.py-327
           */
          var type = {
            1: "replicated",
            3: "erasure"
          };
          angular.forEach(res.crushmap.rules, function (ruleset) {
            $scope.data.cluster.rules[type[ruleset.type]].push(ruleset);
          });
          $scope.data.cluster.loaded = true;
        });
    }
  });

  $scope.ecProfileChange = function () {
    if ($scope.data.profiles.length === 1) {
      $scope.pool.erasure.profile = $scope.data.profiles[0];
    }
  };

  $scope.getMaxSize = function () {
    var osdCount = $scope.data.osdCount;
    var ruleset = $scope.data.ruleset;
    if (ruleset && ruleset.max_size < osdCount) {
      return ruleset.max_size;
    }
    return osdCount;
  };

  $scope.describeStep = function (step) {
    return [
      step.op.replace("_", " "),
      step.item_name || "",
      step.type ? step.num + " type " + step.type : ""
    ].join(" ");
  };

  $scope.rulesetChange = function () {
    if (!$scope.pool.type || !$scope.data.cluster.loaded) {
      return;
    }
    var rules = $scope.data.cluster.rules[$scope.pool.type];
    var ruleset = $scope.data.ruleset;
    if (rules.length !== 1) {
      ruleset = undefined;
    } else if (rules.length === 1) {
      ruleset = rules[0];
    }
    $scope.data.ruleset = ruleset;
    $scope.useRulesetSize();
    $scope.pgSizeChange();
  };

  $scope.useRulesetSize = function () {
    var ruleset = $scope.data.ruleset;
    if (!ruleset || $scope.pool.type !== "replicated") {
      return;
    }
    var size = $scope.pool.size;
    if (size < ruleset.min_size) {
      $scope.pool.size = ruleset.min_size;
    } else if (size > ruleset.max_size) {
      $scope.pool.size = ruleset.max_size;
    }
  };

  $scope.$watch("data.ruleset", function (ruleset) {
    if (ruleset) {
      $scope.pool.crush_ruleset = ruleset.rule_id;
      $scope.useRulesetSize();
    } else {
      $scope.pool.crush_ruleset = undefined;
    }
  });

  $scope.onSizeChange = function () {
    $scope.useRulesetSize();
    $scope.pgSizeChange();
  };

  $scope.submitAction = function (poolForm) {
    if (poolForm.$valid) {
      var pool = {
        name: $scope.pool.name,
        pg_num: $scope.pool.pg_num,
        type: $scope.pool.type,
        fsid: $scope.fsid,
        crush_ruleset: $scope.data.ruleset && $scope.data.ruleset.rule_id
      };
      if (pool.type === "replicated") {
        pool.min_size = 1; // No need for this here - API update needed.
        pool.size = $scope.pool.size;
      } else if (pool.type === "erasure") {
        pool.erasure_code_profile = $scope.pool.erasure.profile.name;
      }
      angular.forEach($scope.data.flags, function (isSet, flag) {
        if (angular.isUndefined(pool.flags) && isSet) {
          pool.flags = [];
        }
        return isSet && pool.flags.push(flag);
      });
      // Compression
      if ($scope.pool.compression_mode !== "none") {
        pool.compression_algorithm = $scope.pool.compression_algorithm;
        pool.compression_mode = $scope.pool.compression_mode;
        pool.compression_min_blob_size = SizeParserService
          .parseInt($scope.data.compression_min_blob_size, "b");
        pool.compression_max_blob_size = SizeParserService
          .parseInt($scope.data.compression_max_blob_size, "b");
        pool.compression_required_ratio =
          $scope.pool.compression_required_ratio;
      }

      cephPoolsService.save(pool)
        .$promise
        .then(function () {
          goToListView();
        }, function () {
          $scope.poolForm.$submitted = false;
        });
    }
  };

  $scope.cancelAction = function () {
    goToListView();
  };

  // Erasure Code Profile
  $scope.addErasureCodeProfile = function () {
    var modalInstance = $uibModal.open({
      controller: "CephErasureCodeProfilesAddCtrl",
      templateUrl: "components/ceph-erasure-code-profiles/templates/add-erasure-code-profile.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve: {
        cluster: function () {
          return $scope.data.cluster;
        },
        osd: function () {
          return $scope.data.osdCount;
        }
      }
    });

    modalInstance.result.then(function (profile) {
      // Add and select created profile
      var len = $scope.data.profiles.push(profile);
      $scope.pool.erasure.profile = $scope.data.profiles[len - 1];
    });
  };

  $scope.deleteErasureCodeProfile = function () {
    var modalInstance = $uibModal.open({
      controller: "CephErasureCodeProfilesDeleteCtrl",
      templateUrl: "components/ceph-erasure-code-profiles/templates/delete-erasure-code-profile.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve: {
        cluster: function () {
          return $scope.data.cluster;
        },
        profile: function () {
          return $scope.pool.erasure.profile;
        }
      }
    });

    modalInstance.result.then(function () {
      // Remove item from select box
      var idx = $scope.data.profiles.indexOf($scope.pool.erasure.profile);
      $scope.data.profiles.splice(idx, 1);
    });
  };

  $scope.updateCompressionMaxBlobSize = function () {
    var size =
      SizeParserService.parseInt($scope.data.compression_max_blob_size, "b");
    $scope.data.compression_max_blob_size = $filter("bytes")(size);
  };

  $scope.updateCompressionMinBlobSize = function () {
    var size =
      SizeParserService.parseInt($scope.data.compression_min_blob_size, "b");
    $scope.data.compression_min_blob_size = $filter("bytes")(size);
  };
});
