"use strict";

var app = angular.module("openattic");
app.controller("VolumeCtrl", function ($scope, $state, VolumeService, SizeParserService, $modal) {
  $scope.data = {};

  $scope.filterConfig = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {
  };

  $scope.$watch("filterConfig", function () {
    VolumeService.filter({
      page: $scope.filterConfig.page + 1,
      page_size: $scope.filterConfig.entries,
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

  $scope.$watch("selection.items", function (items) {
    if (items) {
      $scope.multiSelection = Boolean(items.length);
    } else {
      $scope.multiSelection = false;
    }
  });

  $scope.$watch("selection.item", function (item) {
    $scope.hasSelection = Boolean(item);
    if (!item) {
      $state.go("volumes");
      return;
    }
    $scope.cloneable = item.type.name !== "zfs";

    if ($state.current.name === "volumes" ||
        ($state.current.name === "volumes.detail.cifs" && !item.is_filesystemvolume) ||
        ($state.current.name === "volumes.detail.nfs"  && !item.is_filesystemvolume) ||
        ($state.current.name === "volumes.detail.http" && !item.is_filesystemvolume) ||
        ($state.current.name === "volumes.detail.tftp" && !item.is_filesystemvolume) ||
        ($state.current.name === "volumes.detail.luns" && (!item.is_blockvolume || item.is_filesystemvolume))) {
      $state.go("volumes.detail.status", {volume: item.id});
    } else if ($state.current.name === "volumes.detail.statistics.utilgraphs" && !item.is_filesystemvolume) {
      $state.go("volumes.detail.statistics.perfgraphs", {volume: item.id});
    } else if ($state.current.name === "volumes.detail.statistics.perfgraphs" && !item.is_blockvolume) {
      $state.go("volumes.detail.statistics.utilgraphs", {volume: item.id});
    } else {
      $state.go($state.current.name, {volume: item.id});
    }
  });

  $scope.addAction = function () {
    $state.go("volumes-add");
  };

  $scope.resizeAction = function () {
    var modalInstance = $modal.open({
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
    var modalInstance = $modal.open({
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
    $.smallBox({
      title: item.name + " is not deletable",
      content: "<i class=\"fa fa-clock-o tc_notDeletable\"></i><i> Release the deletion protection in order to be" +
               "able to delete the volume.</i>",
      color: "#C46A69",
      iconSmall: "fa fa-times fa-2x fadeInRight animated",
      timeout: 6000
    });
  }

  $scope.deletionDialog = function (selection) {
    var modalInstance = $modal.open({
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
  }

  $scope.deleteAction = function () {
    if (!$scope.hasSelection) {
      return;
    }
    var item = $scope.selection.item;
    var items = $scope.selection.items;
    if (item && item.is_protected) {
      $scope.protectedMessage(item);
    } else if (item) {
      $scope.deletionDialog(item)
    } else if (items) {
      var protectedVolumes = items.filter(function (item) {
        return item.is_protected
      });
      if (protectedVolumes.length) {
        protectedVolumes.forEach(function (volume) {
          $scope.protectedMessage(volume);
        });
      } else {
        $scope.deletionDialog(items)
      }
    }
  };

  $scope.cloneAction = function () {
    var modalInstance = $modal.open({
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

// kate: space-indent on; indent-width 2; replace-tabs on;
