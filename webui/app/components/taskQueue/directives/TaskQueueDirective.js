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

var app = angular.module("openattic.taskQueue");
app.directive("taskQueueDirective", function () {
  return {
    restrict: "A",
    templateUrl: "components/taskQueue/templates/task-queue-directive.html",
    controller: function ($scope, toasty, $uibModal, $resource, taskQueueService, $timeout) {
      $scope.taskOverview = {
        avr: 0,
        run: 0,
        icon: "fa-hourglass-o",
        updated: 0
      };

      /**
       * Updates the hourglass
       * The hourglass has four different states which will be set according to the amount of running tasks relative to
       * all tasks in the queue.
       */
      $scope.updateTaskOverview = function () {
        var ov = $scope.taskOverview;
        var avr = ov.queue !== 0 ? ov.queue / ov.sum * 100 : 0;
        var icons = ["fa-hourglass-o", "fa-hourglass-end", "fa-hourglass-half", "fa-hourglass-start"];
        var icon = ov.queue !== 0 ? icons[Math.floor(avr / 33.4) + 1] : icons[0];

        $scope.taskOverview.run = ov.queue;
        $scope.taskOverview.avr = avr;
        $scope.taskOverview.icon = icon;
        $scope.taskOverview.updated = 1;
      };

      /**
       * Sums up all active tasks and retrieves the total number of tasks in the queue.
       */
      $scope.loadOverview = function () {
        if (!$scope.user) {
          $scope.taskTimeout = $timeout($scope.loadOverview, 5000);
          return;
        }
        $scope.taskOverview.queue = 0;
        $scope.taskOverview.queueLoad = 0;
        $scope.taskOverview.updated = 0;
        $scope.taskOverview.sum = undefined;
        ["Running", "Not Started"].forEach(function (state) {
          taskQueueService.get({
            pageSize: 1,
            status: state
          })
            .$promise
            .then(function (res) {
              $scope.taskOverview.queue += res.count;
              $scope.taskOverview.queueLoad++;
            })
            .catch(function (error) {
              error.toasty = {
                title: "Background task loading failure",
                msg: "Background tasks with status " + state + " couldn't be loaded.",
                timeout: 10000
              };
              toasty.error(error.toasty);
              throw error;
            });
        });
        taskQueueService.get({
          pageSize: 1
        })
          .$promise
          .then(function (res) {
            $scope.taskOverview.sum = res.count;
          })
          .catch(function (error) {
            error.toasty = {
              title: "Background task loading failure",
              msg: "Background tasks couldn't be loaded.",
              timeout: 10000
            };
            toasty.error(error.toasty);
            throw error;
          });
      };

      /**
       * Watches taskOverview to update the hourglass as soon as the needed data is loaded, after that it's sets the
       * refresh time.
       */
      $scope.$watchCollection("taskOverview", function () {
        if ($scope.taskOverview.sum !== undefined && $scope.taskOverview.queueLoad === 2 &&
            $scope.taskOverview.updated === 0) {
          $scope.updateTaskOverview();
        } else if ($scope.taskOverview.updated === 1) {
          $scope.taskTimeout = $timeout($scope.loadOverview, 15000);
        }
      });

      /**
       * Opens task queue dialog, stops the refresh timeout and refreshes on close.
       */
      $scope.runnersDialog = function () {
        var taskDialog = $uibModal.open({
          windowTemplateUrl: "templates/messagebox.html",
          templateUrl: "components/taskQueue/templates/task-queue-dialog.html",
          controller: "TaskQueueModalCtrl",
          size: "lg",
          animation: false
        });

        taskDialog.opened.then(function () {
          $timeout.cancel($scope.taskTimeout);
        });

        taskDialog.closed.then(function () {
          $scope.loadOverview();
        });
      };

      // Initial load.
      $scope.loadOverview();
    }
  };
});
