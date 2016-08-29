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
    entries: null,
    search: "",
    sortfield: null,
    sortorder: null
  };

  $scope.changeTab = function (goHere, index) {
    if (index === undefined) {
      Object.keys($scope.tabs).some(function (tabName, i) {
        index = i;
        return $scope.tabs[tabName].state === goHere;
      });
    }
    $scope.active = index;
    $state.go(goHere, {
      volume: $scope.selection.item.id,
      "#": "more"
    });
  };

  $scope.tabs = {
    status: {
      show: "selection.item",
      state: "volumes.detail.status",
      class: "tc_statusTab",
      name: "Status"
    },
    statisticsFsVol: {
      show: "selection.item.is_filesystemvolume",
      state: "volumes.detail.statistics.utilgraphs",
      class:"tc_fsStatisticsTab",
      name: "Statistics"
    },
    statisticsBlockVol: {
      show: "selection.item.is_blockvolume && !selection.item.is_filesystemvolume",
      state: "volumes.detail.statistics.perfgraphs",
      class: "tc_blockStatisticsTab",
      name: "Statistics"
    },
    cifs: {
      show: "selection.item.is_filesystemvolume",
      state: "volumes.detail.cifs",
      class: "tc_cifsShareTab",
      name: "CIFS"
    },
    nfs: {
      show: "selection.item.is_filesystemvolume",
      state: "volumes.detail.nfs",
      class: "tc_nfsShareTab",
      name: "NFS"
    },
    http: {
      show: "selection.item.is_filesystemvolume",
      state: "volumes.detail.http",
      class: "tc_httpShareTab",
      name: "HTTP"
    },
    iscsi: {
      show: "selection.item.source_pool && selection.item.is_blockvolume && !selection.item.is_filesystemvolume",
      state: "volumes.detail.luns",
      class: "tc_iscsi_fcTab",
      name: "iSCSI/FC"
    },
    storage: {
      show: "selection.item",
      state: "volumes.detail.storage",
      class: "tc_storageTab",
      name: "Storage"
    },
    snapshots: {
      show: "selection.item",
      state: "volumes.detail.snapshots",
      class: "tc_snapshotTab",
      name: "Snapshots"
    }
  };

  $scope.selection = {};

  $scope.$watch("filterConfig", function (newVal) {
    if (newVal.entries === null) {
      return;
    }
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
      $scope.cloneable = item.type.name !== "zfs";

      if ($state.current.name === "volumes" ||
          ($state.current.name === "volumes.detail.cifs" && !item.is_filesystemvolume) ||
          ($state.current.name === "volumes.detail.nfs"  && !item.is_filesystemvolume) ||
          ($state.current.name === "volumes.detail.http" && !item.is_filesystemvolume) ||
          ($state.current.name === "volumes.detail.tftp" && !item.is_filesystemvolume) ||
          ($state.current.name === "volumes.detail.luns" && (!item.is_blockvolume || item.is_filesystemvolume))) {
        $scope.changeTab("volumes.detail.status");
      } else if ($state.current.name === "volumes.detail.statistics.utilgraphs" && !item.is_filesystemvolume) {
        $scope.changeTab("volumes.detail.statistics.perfgraphs");
      } else if ($state.current.name === "volumes.detail.statistics.perfgraphs" && !item.is_blockvolume) {
        $scope.changeTab("volumes.detail.statistics.utilgraphs");
      } else {
        $scope.changeTab($state.current.name);
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
