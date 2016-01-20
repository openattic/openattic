"use strict";

var app = angular.module("openattic.oaWizards");
app.controller("blockstorage", function ($scope, PoolService, HostService, InitiatorService) {
  PoolService.query()
      .$promise
      .then(function (res) {
        $scope.pools = res;
      }, function (error) {
        console.log("An error occurred", error);
      });

  HostService.query()
      .$promise
      .then(function (res) {
        $scope.hosts = res;
      }, function (error) {
        console.log("An error occurred", error);
      });

  $scope.input = {
    iscsi_fc: {
      lun_id: 0
    }
  };
  $scope.selPoolUsedPercent = 0;

  $scope.$watch("input.iscsi_fc.host", function (host) {
    if (host) {
      $scope.input.iscsi_fc.create = true;
      InitiatorService.filter({
        host: host.id,
        type: "qla2xxx"
      })
          .$promise
          .then(function (res) {
            $scope.has_initiator = (res.count > 0);
          }, function (error) {
            console.log("An error occured", error);
          });
    } else {
      $scope.input.iscsi_fc.create = false;
    }
  });

  $scope.$watch("input.volume.source_pool", function (sourcePool) {
    if (sourcePool) {
      $scope.selPoolUsedPercent = parseFloat(sourcePool.usage.used_pcnt).toFixed(2);
      $scope.contentForm1.source_pool.$setValidity("usablesize", $scope.input.volume.source_pool.usage.free >= 100);
    } else {
      if ($scope.contentForm1) {
        $scope.contentForm1.source_pool.$setValidity("usablesize", true);
      }
    }
  });
});