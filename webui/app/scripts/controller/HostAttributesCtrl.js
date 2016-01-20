"use strict";

var app = angular.module("openattic");
app.controller("HostAttributesCtrl", function ($scope, $state, $stateParams, InitiatorService) {
  $scope.data = {
    iscsiInis: [],
    fcInis: []
  };

  $scope.host = $scope.selection.item;

  var iniAdded = function (tag, type) {
    InitiatorService.save({
      "wwn": tag.text,
      "type": type,
      "host": {"id": $scope.host.id}
    })
        .$promise
        .then(function (res) {
          tag.id = res.id;
        }, function (error) {
          var index;
          if (type === "iscsi") {
            index = $scope.data.iscsiInis.indexOf(tag);
            if (index > -1) {
              $scope.data.iscsiInis.splice(index, 1);
            }
          } else {
            index = $scope.data.fcInis.indexOf(tag);
            if (index > -1) {
              $scope.data.fcInis.splice(index, 1);
            }
          }
          $.smallBox({
            title: "Error adding Initiator",
            content: "<i class=\"fa fa-clock-o\"></i> <i>" + error.data.wwn.join(", ") + ".</i>",
            color: "#C46A69",
            iconSmall: "fa fa-times fa-2x fadeInRight animated",
            timeout: 4000
          });
        });
      };

  $scope.iscsiIniAdded = function (tag) {
    return iniAdded(tag, "iscsi");
  };

  $scope.fcIniAdded = function (tag) {
    return iniAdded(tag, "qla2xxx");
  };

  $scope.iniRemoved = function (tag) {
    InitiatorService.delete({"id": tag.id});
  };

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

  $scope.submitAction = function () {
  };

  var goToListView = function () {
    $state.go("hosts");
  };

  $scope.cancelAction = function () {
    goToListView();
  };
});