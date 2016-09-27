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
app.controller("CephPoolsAddCtrl", function ($scope, $state, $stateParams, $filter, $uibModal, toasty, ClusterResource,
    cephClusterService, cephErasureCodeProfilesService, cephOsdService, cephPoolsService) {
  $scope.pool = {
    name: "",
    pg_num: 1,
    type: "",
    replicated: {
      size: 1, // Replica size
      expert: {
        crush_ruleset: 0
      }
    },
    erasure: {
      profile: null
    }
  };

  $scope.data = {
    cluster: null,
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
    ruleset: null,
    osdCount: 1
  };

  $scope.clusters = {};

  var goToListView = function () {
    $state.go("cephPools");
  };

  $scope.clusterId = $stateParams.clusterId;

  $scope.waitingClusterMsg = "Retrieving cluster list...";
  cephClusterService.get()
    .$promise
    .then(function (clusters) {
      ClusterResource.get()
        .$promise
        .then(function (crushmaps) {
          $scope.clusters = clusters.results;
          $scope.clusters.forEach(function (cluster) {
            var crushmap = crushmaps.results.filter(function (crush) {
              return crush.name === cluster.name;
            });
            if (crushmap.length > 0) {
              cluster.rules = crushmap[0].crushmap.crushmap.rules;
            }
          });
          $scope.waitingClusterMsg = "-- Select a cluster --";
          $scope.clusters.forEach(function (cluster) {
            if (cluster.fsid === $scope.clusterId) {
              $scope.data.cluster = cluster;
            }
          });
          if (!$scope.data.cluster) {
            if (clusters.count > 0) {
              $scope.data.cluster = $scope.clusters[0];
            } else {
              $scope.waitingClusterMsg = "No cluster avialable.";
              toasty.warning({
                title: $scope.waitingClusterMsg,
                msg: "You can't create any RBDs with your configuration."
              });
            }
          }
        })
        .catch(function (crushError) {
          $scope.waitingClusterMsg = "Error: Crushmap couldn't be loaded!";
          toasty.error({
            title: "Loading failure",
            msg: "Crushmap couldn't be loaded.",
            timeout: 10000
          });
          throw crushError;
        });
    })
    .catch(function (clusterError) {
      $scope.waitingClusterMsg = "Error: Cluster couldn't be loaded!";
      toasty.error({
        title: "Loading failure",
        msg: "Cluster list couldn't be loaded.",
        timeout: 10000
      });
      throw clusterError;
    });

  $scope.$watch("data.cluster", function (cluster) {
    if (cluster) {
      $scope.clusterId = cluster.fsid;
      cephOsdService.get({id: cluster.fsid})
        .$promise
        .then(function (res) {
          $scope.data.osdCount = res.count;
        })
        .catch(function (osdError) {
          toasty.error({
            title: "Loading error",
            msg: "OSD's couldn't be loaded.",
            timeout: 10000
          });
          throw osdError;
        });
      cephErasureCodeProfilesService.get({fsid: cluster.fsid})
        .$promise
        .then(function (res) {
          $scope.data.profiles = res.results;

          if ($scope.data.profiles.length === 1) {
            $scope.pool.erasure.profile = $scope.data.profiles[0]
          }
        })
        .catch(function (osdError) {
          toasty.error({
            title: "Loading error",
            msg: "Erasure code profiles couldn't be loaded.",
            timeout: 10000
          });
          throw osdError;
        });
      $scope.data.ruleset = $scope.data.cluster.rules[0];
    }
  });

  $scope.setReplicaSizeError = function (min, max, isValid) {
    isValid = Boolean(isValid);
    $scope.poolForm.crushSet.$setValidity("sizeError", isValid);
    if (!isValid) {
      $scope.poolForm.crushSet.$setDirty();
      $scope.data.expert = true;
    }
    if (min) {
      $scope.replicaSizeError = "Your replica size is to small. To use this rule a replica size of at least " + min +
        " is needed.";
    } else if (max) {
      $scope.replicaSizeError = "Your replica size is to big. To use this rule a replica size of at most " + max +
        " is needed.";
    }
  };

  $scope.rulesetValidation = function () {
    var ruleset = $scope.data.ruleset;
    var size = $scope.pool.replicated.size;
    if (size < ruleset.min_size) {
      $scope.setReplicaSizeError(ruleset.min_size);
    } else if (size > ruleset.max_size) {
      $scope.setReplicaSizeError(null, ruleset.max_size);
    } else {
      $scope.setReplicaSizeError(null, null, true);
    }
  };

  $scope.$watch("data.ruleset", function (ruleset) {
    if (ruleset && $scope.data.cluster) {
      $scope.pool.replicated.expert.crush_ruleset = ruleset.rule_id;
      $scope.rulesetValidation();
    }
  });

  $scope.$watch("pool.replicated.size", function () {
    if ($scope.data.cluster) {
      $scope.rulesetValidation();
    }
  });

  $scope.submitAction = function (poolForm) {
    if (poolForm.$valid) {
      var pool = {
        name: $scope.pool.name,
        pg_num: $scope.pool.pg_num,
        type: $scope.pool.type,
        // Default values needed by the API - API update needed
        // * Should not be needed at any time
        crush_ruleset: 0,
        size: 0,
        // * Should not be needed here at all
        quota_max_objects: 0,
        quota_max_bytes: 0,
        crash_replay_interval: 0,
        cache_mode: "none",
        tier_of: null,
        write_tier: null,
        read_tier: null,
        target_max_bytes: 0,
        hit_set_period: 0,
        hit_set_count: 0,
        // Cluster Definition
        id: $scope.clusterId
      };
      if (pool.type === "replicated") {
        pool.min_size = 1; // No need for this here - API update needed.
        pool.size = $scope.pool[pool.type].size;
        pool.crush_ruleset = $scope.pool[pool.type].expert.crush_ruleset;
      } else if (pool.type === "erasure") {
        pool.min_size = 2; // No need for this here - API update needed.
        pool.erasure_code_profile = $scope.pool[pool.type].profile.name;
      }
      cephPoolsService.save(pool)
        .$promise
        .then(function () {
          goToListView();
        }, function (error) {
          toasty.error({
            title: "Creation failure",
            msg: "Couldn't create Ceph pool.",
            timeout: 10000
          });
          throw error;
        });
    }
  };

  $scope.cancelAction = function () {
    goToListView();
  };

  // Erasure Code Profile
  $scope.deleteErasureCodeProfile = function () {
    var modalInstance = $uibModal.open({
      controller       : "CephErasureCodeProfilesDeleteCtrl",
      templateUrl      : "components/ceph-erasure-code-profiles/templates/delete-erasure-code-profile.html",
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
});
