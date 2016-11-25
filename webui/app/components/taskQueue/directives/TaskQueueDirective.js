/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
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
    controller: function ($scope, toasty, $uibModal, $resource, taskQueueService, $interval) {
      $scope.taskOverview = {
        avr: 0,
        run: 0,
        icon: "fa-hourglass-o",
        percent: 0,
        tooltip: "No tasks running.",
        updated: 0
      };
      $scope.taskUpdateIntervall = 5; //seconds

      /**
       * Updates the hourglass and the tooltip
       * The hourglass has four different states which will be set according to the percentage of all running tasks in
       * relation to their count.
       * The tooltip shows the average percent done over all running tasks.
       */
      $scope.updateTaskOverview = function () {
        var ov = $scope.taskOverview;
        var avr = ov.queue !== 0 ? ov.percent / ov.queue : 0;
        var icons = ["fa-hourglass-o", "fa-hourglass-start", "fa-hourglass-half", "fa-hourglass-end"];
        var icon = ov.queue !== 0 ? icons[Math.floor(avr / 30) + 1] : icons[0];

        $scope.taskOverview.run = ov.queue;
        $scope.taskOverview.avr = avr;
        $scope.taskOverview.icon = icon;
        $scope.taskOverview.updated = 1;
        $scope.taskOverview.tooltip = avr === 0 ? "No tasks running" : parseInt(avr, 10) + "% done in average";
      };

      /**
       * Counts all active tasks and sums up the percentage done of each task.
       */
      $scope.loadOverview = function () {
        if (!$scope.user) {
          $scope.taskTimeout = $interval($scope.loadOverview, 5000, 1);
          return;
        }
        var max = $scope.taskOverview.queue;
        $scope.taskOverview.queue = 0;
        $scope.taskOverview.percent = 0;
        $scope.taskOverview.queueLoad = 0;
        $scope.taskOverview.updated = 0;
        $scope.taskOverview.sum = undefined;
        ["Running", "Not Started"].forEach(function (state) {
          taskQueueService.get({
            pageSize: state === "Running" ? max : 1,
            status: state
          })
            .$promise
            .then(function (res) {
              $scope.taskOverview.queue += res.count;
              $scope.taskOverview.queueLoad++;
              res.results.forEach(function (task) {
                if (typeof task.percent === "number") {
                  $scope.taskOverview.percent += task.percent;
                }
              })
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
      };

      /**
       * Watches taskOverview to update the hourglass as soon as the needed data is loaded, after that it's sets the
       * refresh time.
       */
      $scope.$watchCollection("taskOverview", function () {
        if ($scope.taskOverview.queueLoad === 2 &&
            $scope.taskOverview.updated === 0) {
          $scope.updateTaskOverview();
        } else if ($scope.taskOverview.updated === 1) {
          $scope.taskTimeout = $interval($scope.loadOverview, $scope.taskUpdateIntervall * 1000, 1);
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
          $interval.cancel($scope.taskTimeout);
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
