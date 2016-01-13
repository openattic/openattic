"use strict";

var app = angular.module("openattic");
app.controller("UserCtrl", function ($scope, $state, UserService, $modal) {
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
    UserService.filter({
      page: $scope.filterConfig.page + 1,
      page_size: $scope.filterConfig.entries,
      search: $scope.filterConfig.search,
      ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
    })
    .$promise
    .then(function (res) {
      $scope.data = res;
    })
    .catch(function (error) {
      console.log("An error occurred", error);
    });
  }, true);

  $scope.$watchCollection("selection.item", function (item) {
    $scope.hasSelection = Boolean(item);
  });

  $scope.addAction = function () {
    $state.go("users-add");
  };

  $scope.editAction = function () {
    $state.go("users-edit", {user: $scope.selection.item.id});
  };

  $scope.deleteAction = function () {
    var modalInstance = $modal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/users/user-delete.html",
      controller: "UserDeleteCtrl",
      resolve: {
        user: function () {
          return $scope.selection.item;
        }
      }
    });
    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };
});