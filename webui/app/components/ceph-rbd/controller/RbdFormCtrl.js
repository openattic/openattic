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
app.controller("RbdFormCtrl", function ($scope, $state, $stateParams, cephRbdService, cephPoolsService,
    SizeParserService, $filter, toasty) {

  $scope.rbd = {
    name: "",
    size: 0,
    pool: -1,
    old_format: true,
    obj_size: 4194304
  };

  $scope.data = {
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
    obj_size: "4 MB",
    size: "",
    expert: false,
    cluster: $stateParams.clusterId
  };

  $scope.pools = {};

  $scope.features = {
    "deep-flatten": {
      desc: "Deep flatten",
      helpText: "",
      requires: null,
      excludes: null
    },
    "layering": {
      desc: "Layering",
      helpText: "",
      requires: null,
      excludes: "stripingv2"
    },
    "stripingv2": {
      desc: "Striping",
      helpText: "",
      requires: null,
      excludes: "layering"
    },
    "exclusive-lock": {
      desc: "Exclusive lock",
      helpText: "",
      requires: null,
      excludes: null
    },
    "object-map": {
      desc: "Object map",
      helpText: "",
      requires: "exclusive-lock",
      excludes: null
    },
    "journaling": {
      desc: "Journaling",
      helpText: "",
      requires: "exclusive-lock",
      excludes: null
    },
    "fast-diff": {
      desc: "Fast diff",
      helpText: "",
      requires: "object-map",
      excludes: null
    }
  };

  $scope.defaultFeatureValues = {};
  angular.copy($scope.data.features, $scope.defaultFeatureValues);

  var deepBoxCheck = function (key, checked) {
    angular.forEach($scope.features, function (details, feature) {
      if (details.requires === key) {
        $scope.data.features[feature].disabled = !checked;
        if (!checked) {
          $scope.data.features[feature].checked = checked; // Always.
          deepBoxCheck(feature, checked);
        }
      }
      if (details.excludes === key) {
        $scope.data.features[feature].disabled = checked;
      }
    });
  };

  $scope.$watch("data.features", function (newSet, oldSet) {
    var key = false;
    var hits = 0;
    for (var feature in newSet) {
      if (newSet[feature].checked !== oldSet[feature].checked) {
        hits++;
        if (!key) {
          key = feature;
        }
      }
    }
    if (!key || hits != 1) {
      return;
    }
    var checked = newSet[key].checked;
    if (checked) {
      var required = $scope.features[key].requires;
      var excluded = $scope.features[key].excludes;
      if (excluded && newSet[excluded].checked || required && !newSet[required].checked) {
        $scope.data.features[key].checked = false;
        return;
      }
    }

    deepBoxCheck(key, checked);
  }, true);

  $scope.defaultFeatures = function () {
    angular.copy($scope.defaultFeatureValues, $scope.data.features);
  };

  $scope.updateObjSize = function (size, old, jump) {
    if (size.match(/[+-]+/)) {
      size = size.replace(/[+-]+/, "");
    }
    if (size === old) {
      $scope.data.obj_size = size;
      return;
    }
    size = SizeParserService.parseInt(size, "b", "k"); //default input size is KB
    var power = 0;
    if (size !== null && size !== 0) {
      power =  Math.round(Math.log(size) / Math.log(2));
      if (typeof jump === "number") {
        power += jump;
      }
    }
    if (power < 12) {
      size = 1 << 12; // Set size to minimum of 4 KB.
    } else if (power > 25) {
      size = 1 << 25; // Set size to maximum of 32 MB.
    } else {
      size = 1 << power; // Set size the nearest accurate size.
    }
    if ($scope.rbd.obj_size !== size) {
      $scope.rbd.obj_size = size;
    }
    $scope.data.obj_size = $filter("bytes")(size);
  };

  $scope.objSizeChange = function (event) {
    if (event.keyCode === 38 || event.keyCode === 40) { // 38 == up arrow && 40 == down arrow
      $scope.updateObjSize($scope.data.obj_size, null, 39 - event.keyCode);
    } else if (event.keyCode === 187 || event.keyCode === 189) {
      $scope.updateObjSize($scope.data.obj_size, null, 188 - event.keyCode);
    }
  };

  $scope.$watch("data.obj_size", $scope.updateObjSize);

  $scope.$watch("data.size", function (size) {
    if (size === "") {
      return;
    }
    size = SizeParserService.parseInt(size, "b");
    var objNum = parseInt(size / $scope.data.obj_size, 10);
    if (objNum < 1) {
      $scope.data.size = $filter("bytes")($scope.data.obj_size);
    } else {
      $scope.data.size = $filter("bytes")(size);
    }
  });

  $scope.$watch("data.pool", function (pool) {
    if (!pool) {
      $scope.data.expert = false;
    }
  });

  var goToListView = function () {
    $state.go("cephRbds");
  };

  if ($stateParams.clusterId === null) {
    goToListView();
  } else {
    cephPoolsService.get({
        id: $stateParams.clusterId
      })
      .$promise
      .then(function (res) {
        res.results.forEach(function (pool) {
          pool.oaUsed = $filter("number")(pool.num_bytes / pool.max_avail * 100, 2);
          pool.oaUnused = 100 - pool.oaUsed;
          pool.oaFree = pool.max_avail - pool.num_bytes;
          //pool.oaMaxFree = (pool.max_avail - pool.num_bytes) >> 20; // Did not work, don't know why.
          pool.oaMaxFree = parseInt((pool.max_avail - pool.num_bytes) / (1 << 20), 10);
          pool.oaFreeText = $filter("bytes")(pool.oaFree);
          if (pool.name === "rbd"){
            $scope.data.pool = pool;
          }
        });
        $scope.pools = res.results;
      }, function (error) {
        console.log("An error occurred", error);
      });
  }

  $scope.submitAction = function (rbdForm) {
    if (rbdForm.$valid) {
      if ($scope.data.expert) {
        $scope.rbd.old_format = false;
        var features = [];
        for (var feature in $scope.data.features) {
          if ($scope.data.features[feature].checked) {
            features.push(feature);
          }
        }
        $scope.rbd.features = features;
      }
      $scope.rbd.pool = $scope.data.pool.id;
      $scope.rbd.id = $stateParams.clusterId;
      $scope.rbd.size = SizeParserService.parseInt($scope.data.size, "b");
      cephRbdService.save($scope.rbd)
        .$promise
        .then(function (res) {
          $scope.rbd = res;
          goToListView();
        }, function (error) {
          var toastMsg = "Could not create the RBD through a server failure.";
          if (error.status === 400) {
            if (error.data.size) {
              var size = error.data.size[0].match(/[0-9]+/)[0];
              toastMsg = "The size you have choose is to big, choose a size lower than " + $filter("bytes")(size);
            } else {
              toastMsg = "Could not create the RBD because of " + $filter("json")(error.data);
            }
          }
          toasty.error({
            title: "Can't create RBD",
            msg: toastMsg,
            timeout: 10000
          });
          console.log("An error occured", error);
        });
    }
  };

  $scope.cancelAction = function () {
    goToListView();
  };

});
