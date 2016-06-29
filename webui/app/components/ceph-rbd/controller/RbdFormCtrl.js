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
    SizeParserService) {
  $scope.rbd = {
    name: "",
    size: 0,
    pool: -1,
    features: []
  };
  $scope.accordionOpen = {
    properties: true
  };

  $scope.data = {
    pool: null,
    features: {
      "deep-flatten": false,
      "layering": false,
      "striping": false,
      "exclusive-lock": false,
      "object-map": false,
      "journaling": false,
      "fast-diff": false
    },
    cluster: $stateParams.clusterId
  };

  /*
   * Output should be:
            "name": "foo",
            "pool": 0,
            "size": 4294967296,  //bytes
            "features": []
  //["deep-flatten", "layering", "striping", "exclusive-lock", "object-map", "journaling", "fast-diff"]
   * */

  $scope.pools = {};
  $scope.features = {
    "deep-flatten": {
      desc: "Deepflatten"
    },
    "layering": {
      desc: "Layerd",
      helpText: ""
    },
    "striping": {
      desc: "Striping",
      helpText: ""
    },
    "exclusive-lock": {
      desc: "Exclusive locked",
      helpText: ""
    },
    "object-map": {
      desc: "Object mapping",
      helpText: ""
    },
    "journaling": {
      desc: "Journaling",
      helpText: ""
    },
    "fast-diff": {
      desc: "Fast diff",
      helpText: ""
    }
  };
  console.log($stateParams);

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
        $scope.pools = res.results;
      }, function (error) {
        console.log("An error occurred", error);
      });
  }

  $scope.submitAction = function (rbdForm) {
    if (rbdForm.$valid) {
      var features = [];
      for (var feature in $scope.data.features) {
        if ($scope.data.features[feature]) {
          features.push(feature);
        }
      }
      //$scope.rbd.name = "test" + Math.random().toString().substr(10);
      //$scope.rbd.size = parseInt(Math.random() * 4096 * 1024 * 16)
      $scope.rbd.features = features;
      $scope.rbd.pool = $scope.data.pool.id;
      $scope.rbd.id = $stateParams.clusterId;
      $scope.rbd.size = SizeParserService.parseInt($scope.data.size, "b");
      console.log($scope.rbd);
      cephRbdService.save($scope.rbd)
        .$promise
        .then(function (res) {
          $scope.rbd = res;
          console.log(res);
          goToListView();
        }, function (error) {
          console.log("An error occured", error);
          goToListView();
        });
    }
  };

  $scope.cancelAction = function () {
    goToListView();
  };

});
