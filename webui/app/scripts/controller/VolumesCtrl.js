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
app.controller("VolumeCtrl", function ($scope, $state, VolumeService, SizeParserService, $uibModal, toasty) {
  $scope.data = {};

  $scope.filterConfig = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};

  $scope.$watch("filterConfig", function () {
    VolumeService
      .filter({
        page: $scope.filterConfig.page + 1,
        pageSize: $scope.filterConfig.entries,
        search: $scope.filterConfig.search,
        ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield,
        upper__isnull: "True"
      })
      .$promise
      .then(function (res) {
        $scope.data = res;
      })
      .catch(function (error) {
        console.log("An error occurred", error);
      });
  }, true);

  $scope.$watchCollection("selection", function (selection) {
    var item = selection.item;
    var items = selection.items;

    $scope.multiSelection = Boolean(items) && items.length > 1;

    $scope.hasSelection = Boolean(item);

    if (!item && !items) {
      $state.go("volumes");
      return;
    }

    if (item) {
      $scope.resizeable = item.is_blockvolume === true || item.type.name !== "btrfs subvolume";
      // Until btrfs is resizeable:
      if (item.type.name === "btrfs subvolume") {
        $scope.resizeable = false;
      }
      $scope.cloneable = item.type.name !== "zfs";

      if ($state.current.name === "volumes" ||
          ($state.current.name === "volumes.detail.cifs" && !item.is_filesystemvolume) ||
          ($state.current.name === "volumes.detail.nfs"  && !item.is_filesystemvolume) ||
          ($state.current.name === "volumes.detail.http" && !item.is_filesystemvolume) ||
          ($state.current.name === "volumes.detail.tftp" && !item.is_filesystemvolume) ||
          ($state.current.name === "volumes.detail.luns" && (!item.is_blockvolume || item.is_filesystemvolume))) {
        $state.go("volumes.detail.status", {
          volume: item.id,
          "#": "more"
        });
      } else if ($state.current.name === "volumes.detail.statistics.utilgraphs" && !item.is_filesystemvolume) {
        $state.go("volumes.detail.statistics.perfgraphs", {
          volume: item.id,
          "#": "more"
        });
      } else if ($state.current.name === "volumes.detail.statistics.perfgraphs" && !item.is_blockvolume) {
        $state.go("volumes.detail.statistics.utilgraphs", {
          volume: item.id,
          "#": "more"
        });
      } else {
        $state.go($state.current.name, {
          volume: item.id,
          "#": "more"
        });
      }
    }
  });

  $scope.addAction = function () {
    $state.go("volumes-add");
  };

  $scope.resizeAction = function () {
    var modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/resize.html",
      controller: "VolumeResizeCtrl",
      resolve: {
        volume: function () {
          return $scope.selection.item;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    }, function () {});
  };

  $scope.protectionAction = function () {
    if (!$scope.selection.item) {
      return;
    }
    var modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/protection.html",
      controller: "VolumeProtectionCtrl",
      resolve: {
        volume: function () {
          return $scope.selection.item;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    }, function () {
      $scope.filterConfig.refresh = new Date();
    });
  };

  $scope.moreOptionsAction = function () {
    $("#more").effect("highlight", {}, 3000);
  };

  $scope.protectedMessage = function (item) {
    toasty.warning({
      title: item.name + " is not deletable",
      msg: "Release the deletion protection in order to be able to delete the volume.",
      timeout: 6000
    });
  };

  $scope.deletionDialog = function (selection) {
    var modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/delete.html",
      controller: "VolumeDeleteCtrl",
      resolve: {
        volumeSelection: function () {
          return selection;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };

  $scope.deleteAction = function () {
    if (!$scope.hasSelection && !$scope.multiSelection) {
      return;
    }
    var item = $scope.selection.item;
    var items = $scope.selection.items;
    if (item && item.is_protected) {
      $scope.protectedMessage(item);
    } else if (item) {
      $scope.deletionDialog(item);
    } else if (items) {
      var protectedVolumes = items.filter(function (item) {
        return item.is_protected;
      });
      if (protectedVolumes.length) {
        protectedVolumes.forEach(function (volume) {
          $scope.protectedMessage(volume);
        });
      } else {
        $scope.deletionDialog(items);
      }
    }
  };

  $scope.cloneAction = function () {
    var modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/clone.html",
      controller: "VolumeCloneCtrl",
      resolve: {
        volume: function () {
          return $scope.selection.item;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };
});
