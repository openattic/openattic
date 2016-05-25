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

var app = angular.module("openattic");
app.controller("HostFormCtrl", function ($scope, $state, $stateParams, HostService, InitiatorService, $q) {

  $scope.changes = [];
  $scope.data = {};

  var goToListView = function () {
    $state.go("hosts");
  };

  InitiatorService.get()
    .$promise
    .then(function (res) {
      $scope.wwns = [];
      res.results.forEach(function (share) {
        $scope.wwns.push(share.wwn);
      });
    }, function (error) {
      console.log("An error occurred", error);
    });

  $scope.loadInitiators = function () {
    $scope.data.iscsiInis = [];
    $scope.data.fcInis = [];
    InitiatorService.get({host: $stateParams.host})
      .$promise
      .then(function (res) {
        for (var i = 0; i < res.results.length; i++) {
          if (res.results[i].type === "iscsi") {
            $scope.data.iscsiInis.push({
              "text": res.results[i].wwn,
              "id": res.results[i].id
            });
          } else {
            $scope.data.fcInis.push({
              "text": res.results[i].wwn,
              "id": res.results[i].id
            });
          }
        }
      }, function (error) {
        console.log("An error occurred", error);
      });
  };

  if (!$stateParams.host) {
    $scope.host = {};
    $scope.editing = false;

    $scope.submitAction = function (hostForm) {
      $scope.submitted = true;
      if (hostForm.$valid === true) {
        HostService.save($scope.host)
            .$promise
            .then(function (res) {
              $scope.host = res;
              $scope.saveShares();
            }, function (error) {
              console.log("An error occured", error);
            });
      }
    };
  } else {
    $scope.editing = true;
    $scope.data = {
      peerHostUrl: "",
      iscsiIqn: "",
      fcWwn: ""
    };

    HostService.get({id: $stateParams.host})
        .$promise
        .then(function (res) {
          $scope.host = res;
        }, function (error) {
          console.log("An error occurred", error);
        });

    $scope.loadInitiators();

    $scope.submitAction = function (hostForm) {
      $scope.submitted = true;
      if (hostForm.$valid === false) {
        return;
      }
      var requests = [];
      var deletes = $scope.changes.filter(function (change) {
        return change.type === "delete";
      });
      deletes.forEach(function (change) {
        var deferred = $q.defer();
        InitiatorService.delete({"id": change.tag.id}, deferred.resolve, deferred.reject);
        requests.push(deferred.promise);
      });
      $q.all(requests).then(function () {
        HostService.update({id: $scope.host.id}, $scope.host)
            .$promise
            .then(function () {
              $scope.saveShares();
            }, function (error) {
              console.log("An error occured", error);
            });
      }, function (error) {
        $scope.loadInitiators();
        console.log("An error occured", error);
      });
    };
  }

  $scope.saveShares = function () {
    var requests = [];
    var creates = $scope.changes.filter(function (change) {
      return change.type !== "delete";
    });
    creates.forEach(function (change) {
      var deferred = $q.defer();
      InitiatorService.save({
        "wwn": change.tag.text,
        "type": change.type,
        "host": {"id": $scope.host.id}
      }, deferred.resolve, deferred.reject);
      requests.push(deferred.promise);
    });
    $q.all(requests).then(function () {
      goToListView();
    }, function (error) {
      $scope.loadInitiators();
      console.log("An error occured", error);
    });
  };

  $scope.cancelAction = function () {
    goToListView();
  };

  $scope.validShareName = function (tag) {
    return $scope.wwns.indexOf(tag.text) === -1;
  };

  $scope.addShare = function (tag, type) {
    $scope.wwns.push(tag.text);
    $scope.changes.push({
      tag: tag,
      type: type
    });
  };

  $scope.iniRemoved = function (tag) {
    $scope.wwns.splice($scope.wwns.indexOf(tag.text), 1);
    if (!tag.id) {
      $scope.changes.forEach(function (change, index) {
        if (change.tag.text === tag.text) {
          $scope.changes.splice(index, 1);
          return;
        }
      });
      return;
    }
    $scope.changes.push({
      tag: tag,
      type: "delete"
    });
  };

});
