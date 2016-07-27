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

var app = angular.module("openattic.dashboard");
app.controller("DashboardCtrl", function ($scope, $uibModal, toasty, dashboardService) {
  // Basic configuration
  var dashboardKey = "oa_dashboard";
  $scope.data = globalConfig.GUI.defaultDashboard;
  $scope.preventSaving = false;

  $scope.gridsterOptions = {
    columns         : 6,
    swapping        : true,
    margins         : [15, 15],
    mobileBreakPoint: 768,
    minRows         : 1,
    draggable       : {
      enabled: true,
      handle : ".panel-heading",
      stop   : function () {
        $scope.saveDashboard();
      }
    },
    resizable       : {
      enabled: true,
      stop   : function () {
        $scope.saveDashboard();
      }
    }
  };

  $scope.manager = [];

  // functions
  $scope.addDashboard = function () {
    var modalInstance = $uibModal.open({
      controller       : "DashboardAddCtrl",
      templateUrl      : "components/dashboard/templates/add-dashboard.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve          : {
        data: {}
      }
    });

    modalInstance.result.then(function (data) {
      var idx = $scope.data.boards.length;

      $scope.data.boards.push({
        "id"     : idx,
        "name"   : data.name,
        "widgets": []
      });

      // Select and save new dashboard
      $scope.dashboard = $scope.data.boards[idx];
      $scope.data.settings.activeBoard = idx;

      // Will be saved automatically by watcher
      toasty.success({
        title: "Dashboard added",
        msg  : "Dashboard '" + data.name + "' successfully created."
      });
    });
  };

  $scope.editDashboard = function () {
    var modalInstance = $uibModal.open({
      controller       : "DashboardEditCtrl",
      templateUrl      : "components/dashboard/templates/edit-dashboard.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve          : {
        data: {
          "type": "dashboard",
          "name": $scope.dashboard.name
        }
      }
    });

    modalInstance.result.then(function (data) {
      $scope.dashboard.name = data.name;

      $scope.saveDashboard();
      toasty.success({
        title: "Dashboard edited",
        msg  : "Dashboard '" + $scope.dashboard.name + "' successfully edited."
      });
    });
  };

  $scope.clearDashboard = function () {
    var modalInstance = $uibModal.open({
      controller       : "DashboardDeleteCtrl",
      templateUrl      : "components/dashboard/templates/delete-widgets.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve          : {
        data: {
          "name": $scope.dashboard.name
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.dashboard.widgets = [];

      $scope.saveDashboard();
      toasty.success({
        title: "Dashboard cleared",
        msg  : "Dashboard '" + $scope.dashboard.name + "' successfully cleared."
      });
    });
  };

  $scope.deleteDashboard = function () {
    var modalInstance = $uibModal.open({
      controller       : "DashboardDeleteCtrl",
      templateUrl      : "components/dashboard/templates/delete-dashboard.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve          : {
        data: {
          "name": $scope.dashboard.name
        }
      }
    });

    modalInstance.result.then(function () {
      var idx = $scope.dashboard.id;

      // Delete board and update IDs
      $scope.data.boards.splice(idx, 1);
      updateIds($scope.data.boards, idx);

      // Select other board
      $scope.data.settings.activeBoard = 0;

      // Will be saved automatically by watcher only when idx != 0
      if (idx === 0) {
        $scope.saveDashboard();
      }
      toasty.success({
        title: "Dashboard deleted",
        msg  : "Dashboard '" + $scope.dashboard.name + "' successfully deleted."
      });
    });
  };

  $scope.addWidget = function () {
    var modalInstance = $uibModal.open({
      controller       : "DashboardAddCtrl",
      templateUrl      : "components/dashboard/templates/add-widget.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve          : {
        data: {
          "manager": $scope.manager
        }
      }
    });

    modalInstance.result.then(function (data) {
      var idx = $scope.dashboard.widgets.length;

      $scope.dashboard.widgets.push({
        "id"      : idx,
        "name"    : data.name,
        "manager" : data.manager,
        "settings": {},
        "sizeX"   : "1",
        "sizeY"   : "1"
      });

      $scope.saveDashboard();
      toasty.success({
        title: "Widget added",
        msg  : "Widget '" + data.name + "' successfully created."
      });
    });
  };

  $scope.editWidget = function (idx, name) {
    var modalInstance = $uibModal.open({
      controller       : "DashboardEditCtrl",
      templateUrl      : "components/dashboard/templates/edit-widget.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve          : {
        data: {
          "type"           : "widget",
          "name"           : name,
          "manager"        : $scope.manager,
          "selectedManager": $scope.dashboard.widgets[idx].manager
        }
      }
    });

    modalInstance.result.then(function (data) {
      $scope.dashboard.widgets[idx].name = data.name;
      $scope.dashboard.widgets[idx].manager = data.manager;
      $scope.dashboard.widgets[idx].settings = {};

      $scope.saveDashboard();
      toasty.success({
        title: "Widget edited",
        msg  : "Widget '" + name + "' successfully edited."
      });
    });
  };

  $scope.deleteWidget = function (idx, name) {
    var modalInstance = $uibModal.open({
      controller       : "DashboardDeleteCtrl",
      templateUrl      : "components/dashboard/templates/delete-widget.html",
      windowTemplateUrl: "templates/messagebox.html",
      resolve          : {
        data: {
          "name": name
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.dashboard.widgets.splice(idx, 1);
      updateIds($scope.dashboard.widgets, idx);

      $scope.saveDashboard();
      toasty.success({
        title: "Widget deleted",
        msg  : "Widget '" + name + "' successfully deleted."
      });
    });
  };

  $scope.lockDashboard = function () {
    $scope.data.settings.locked = !$scope.data.settings.locked;
    $scope.saveDashboard();
  };

  $scope.saveDashboard = function () {
    var obj = {};
    obj[dashboardKey] = $scope.data;

    dashboardService
        .save(obj)
        .$promise
        .then(function () {
          toasty.success({
            title: "Dashboard saved",
            msg  : "Changes have been saved successfully."
          });
        })
        .catch(function (err) {
          throw err;
        });
  };

  var updateIds = function (container, idx) {
    for (var i = idx; i < container.length; i++) {
      container[i].id--;
    }
  };

  var init = function () {
    dashboardService
        .get({"search": dashboardKey})
        .$promise
        .then(function (res) {
          // load dashboard
          if (res.results[0].preferences.hasOwnProperty(dashboardKey)) {
            if ($scope.data.settings.activeBoard !== res.results[0].preferences[dashboardKey].settings.activeBoard) {
              $scope.preventSaving = true;
            }

            $scope.data = res.results[0].preferences[dashboardKey];
            $scope.dashboard = $scope.data.boards[$scope.data.settings.activeBoard];
            return;
          }

          // if no dashboard is saved, create default
          var obj = {};
          obj[dashboardKey] = $scope.data;
          $scope.dashboard = $scope.data.boards[$scope.data.settings.activeBoard];

          $scope.saveDashboard();
        })
        .catch(function (error) {
          throw error;
        });
  };

  // watcher
  $scope.$watch("data.settings.activeBoard", function (newValue, oldValue) {
    if (angular.equals(newValue, oldValue)) {
      return;
    }

    if ($scope.preventSaving) {
      $scope.preventSaving = false;
      return;
    }

    $scope.saveDashboard();
    $scope.dashboard = $scope.data.boards[newValue];
  });

  $scope.$watch("data.settings.locked", function (newValue) {
    $scope.gridsterOptions.draggable.enabled = !newValue;
    $scope.gridsterOptions.resizable.enabled = !newValue;
  });

  // init dashboard
  init();
});