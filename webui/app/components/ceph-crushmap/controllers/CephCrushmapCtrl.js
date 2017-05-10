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

var app = angular.module("openattic.cephCrushmap");
app.controller("CephCrushmapCtrl", function ($scope, $timeout, cephCrushmapService, clusterData, Notification,
    registryService) {
  $scope.cluster = null;
  $scope.clusters = clusterData;
  $scope.registry = registryService;
  $scope.repsize = 3;

  if ($scope.clusters.results.length > 0 && angular.isUndefined($scope.registry.selectedCluster)) {
    $scope.registry.selectedCluster = $scope.clusters.results[0];
  }

  $scope.getCrushmap = function () {
    if ($scope.clusters.results.length > 0 && $scope.registry.selectedCluster) {
      cephCrushmapService
        .get({fsid: $scope.registry.selectedCluster.fsid})
        .$promise
        .then(function (res) {
          $scope.cluster = res;
        })
        .catch(function (error) {
          $scope.error = error;
        });
    }
  };
  $scope.getCrushmap();

  $scope.setActiveRuleset = function (activeRuleset) {
    $scope.activeRuleset = activeRuleset;
  };
  $scope.setActiveRuleset(null);

  $scope.findNodeByName = function (name) {
    var node = null;
    var iterfn = function (item) {
      if (item.name === name) {
        node = item;
      } else {
        item.items.map(iterfn);
      }
    };
    $scope.cluster.crushmap.buckets.map(iterfn);
    return node;
  };
  $scope.findTypeByName = function (name) {
    return $scope.cluster.crushmap.types.find(function (item) {
      return item.name === name;
    });
  };

  $scope.$watch("repsize", function (repsize) {
    if ($scope.activeRuleset) {
      if (repsize < $scope.activeRuleset.min_size) {
        $scope.repsize = $scope.activeRuleset.min_size;
      }
      if (repsize > $scope.activeRuleset.max_size) {
        $scope.repsize = $scope.activeRuleset.max_size;
      }
    }
  });

  var rerenderNodes = function () {
    // deep watcher that keeps track of min/max sanity etc
    var resetNodes;
    var renderNodes;
    var rendersteps;
    var s;
    var step;
    var stepset;
    var prevStepCount;
    var activeRuleset = $scope.activeRuleset;
    if (!$scope.cluster) {
      return;
    }
    $scope.repsize = 3;
    $scope.stepsets = [];
    if (activeRuleset) {
      // Force sensible min/max
      if (activeRuleset.min_size < 1) {
        activeRuleset.min_size = 1;
      }
      if (activeRuleset.max_size < activeRuleset.min_size) {
        activeRuleset.max_size = activeRuleset.min_size;
      }
      // Try to keep the repsize to 3 if the ruleset allows it
      if (activeRuleset.min_size <= 3 && 3 <= activeRuleset.max_size) {
        $scope.repsize = 3;
      } else if (activeRuleset.min_size <= 2 && 2 <= activeRuleset.max_size) {
        // It does not. Try 2...
        $scope.repsize = 2;
      } else {
        // Seems we'll just have to use whatever the minimum is then :(
        $scope.repsize = activeRuleset.min_size;
      }
      // Split the steps into stepsets, where each describes steps from "take" to "emit".
      for (s = 0; s < activeRuleset.steps.length; s++) {
        step = activeRuleset.steps[s];
        if (step.op === "take") {
          stepset = {};
          stepset.take = $scope.findNodeByName(step.item_name);
        } else if (step.op === "choose_firstn") {
          stepset.groupbytype = $scope.findTypeByName(step.type);
        } else if (step.op === "chooseleaf_firstn") {
          stepset.acrosstype = $scope.findTypeByName(step.type);
          stepset.num = step.num;
          stepset.replicas = $scope.getRealNum(stepset);
        } else if (step.op === "emit") {
          $scope.stepsets.push(stepset);
        }
      }
    }
    resetNodes = function (nodes) {
      var i;
      var node;
      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        node.isRootNode = false;
        node.isBelowRootNode = false;
        node.isSelectorNode = false;
        node.nextStep = null;
        resetNodes(node.items);
      }
    };
    renderNodes = function (steps, nodes, isBelowRootNode) {
      var i;
      var node;
      var substeps;

      for (i = 0; i < nodes.length; i++) {
        substeps = steps;
        node = nodes[i];

        if (steps[0].op === "take") {
          if (steps[0].item === node.id) {
            node.isRootNode = true;
            isBelowRootNode = true;
            node.nextStep = steps[1];
            steps.shift();
          }
        } else if (steps[0].op === "choose_firstn" || steps[0].op === "chooseleaf_firstn") {
          node.isBelowRootNode = isBelowRootNode;
          if (steps[0].type === node.type_name) {
            node.isSelectorNode = true;
            node.nextStep = steps[1];
            substeps = steps.slice();
            substeps.shift();
          }
        }
        if (node.items.length > 0) {
          renderNodes(substeps, node.items, isBelowRootNode);
        }
        if (node.isRootNode) {
          while (steps.length > 0 && steps[0].op !== "take") {
            steps.shift();
          }
        }
        if (steps.length === 0) {
          return;
        }
      }
    };

    rendersteps = (activeRuleset ? activeRuleset.steps.slice() : []);
    resetNodes($scope.cluster.crushmap.buckets);
    while (rendersteps.length > 0) {
      prevStepCount = rendersteps.length;
      renderNodes(rendersteps, $scope.cluster.crushmap.buckets, false);
      if (rendersteps.length >= prevStepCount) {
        // Safety measure: renderNodes should consume a coupl'a steps. If it
        // didn't, something seems to be wrong.
        throw "The CRUSH map renderer seems unable to render this CRUSH map ruleset.";
      }
    }
  };
  $scope.$watch("activeRuleset", rerenderNodes, true);

  $scope.treeOptions = {
    accept: function (sourceNodeScope, destNodesScope) {
      if (!destNodesScope.$parent.$modelValue) {
        return true; // moved to the root level
      }
      // If there are any other nodes in the destination, only accept if their types match ours
      for (var i = 0; i < destNodesScope.$modelValue.length; i++) {
        if (destNodesScope.$modelValue[i].type_id !== sourceNodeScope.$modelValue.type_id) {
          return false;
        }
      }
      // Now make sure we put racks in datacenters and not vice versa
      return sourceNodeScope.$modelValue.type_id < destNodesScope.$parent.$modelValue.type_id;
    },
    beforeDrag: function (sourceNodeScope) {
      // ok, so beforeDrag gets fired once for the node clicked, and if that returns
      // false, it gets fired AGAIN for each parent node right up to the root.
      // So, if we're supposed to find a new "take" node, defer setting
      // edittakenode to false by 25 ms, so we can return false for ALL tree nodes,
      // and then only execute the first update (otherwise we'd choose the root
      // node instead of the one that has actually been clicked).
      if ($scope.edittakenode) {
        $timeout(function () {
          if ($scope.edittakenode) {
            $scope.newstepset.take = sourceNodeScope.$modelValue;
            $scope.edittakenode = false;
          }
        }, 25);
        return false;
      }
      return true;
    },
    dropped: function () {
      rerenderNodes();
    }
  };

  $scope.getRealNum = function (step) {
    if (!step) {
      return;
    }
    if (step.num <= 0) {
      return {
        min: $scope.activeRuleset.min_size + step.num,
        max: $scope.activeRuleset.max_size + step.num
      };
    }
    return {
      min: step.num
    };
  };
});