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
    controller: function ($scope, toasty, $uibModal, $resource, taskQueueService, $interval, $http) {
      $scope.taskOverview = {
        firstUpdate: true,
        oldTasks: {},
        tasks: {
          "Running": [],
          "Not Started": [],
          "Exception": [],
          "Aborted": [],
          "Finished": []
        },
        avr: 0,
        queue: 0,
        icon: "fa-hourglass-o",
        percent: 0,
        tooltip: "No tasks running.",
        updated: false
      };
      $scope.taskUpdateIntervall = 5; //seconds

      /**
       * Update all needed parts.
       *
       * Hourglass update:
       * The hourglass has four different states which will be set according to the percentage of all running tasks in
       * relation to their count.
       *
       * Tooltip update:
       * The tooltip shows the average percent done over all running tasks.
       *
       * If toasties are needed:
       * Toasties are created if their is a changed between the finalized tasks from the last and the current task
       * update.
       */
      $scope.updateTaskOverview = function () {
        var ov = $scope.taskOverview;
        ov.percent = 0;
        ov.tasks.Running.forEach(function (task) {
          ov.percent += task.percent;
        });
        ov.queue = ov.tasks.Running.length + ov.tasks["Not Started"].length;
        ov.avr = ov.queue !== 0 ? ov.percent / ov.queue : 0;
        ov.icons = ["fa-hourglass-o", "fa-hourglass-start", "fa-hourglass-half", "fa-hourglass-end"];
        ov.icon = ov.queue !== 0 ? ov.icons[Math.floor(ov.avr / 30) + 1] : ov.icons[0];
        ov.tooltip = ov.avr === 0 ? "No tasks running" : parseInt(ov.avr, 10) + "% done in average";
        if (ov.firstUpdate) {
          ov.firstUpdate = false;
        } else {
          $scope.createNeededToasties();
        }
        $scope.taskOverview = ov;
        $scope.taskTimeout = $interval($scope.loadOverview, $scope.taskUpdateIntervall * 1000, 1);
      };

      /**
       * Toasties are created if their is a changed between the finalized tasks from the last and the current task
       * update.
       */
      $scope.createNeededToasties = function () {
        var moved = $scope.getNewFinalTasks(); //id's
        var tasks = $scope.taskOverview.tasks;
        if (moved.length !== 0) {
          Object.keys(tasks).forEach(function (state) {
            tasks[state].forEach(function (task) {
              if (moved.indexOf(task.id) !== -1) {
                var toast = {
                  title: task.status + ": " + task.description,
                  msg: task.description + " has been " + task.status.toLowerCase() + ".",
                };
                if (task.status === "Finished") {
                  toast.timeout = 3000;
                  toasty.success(toast);
                } else if (task.status === "Aborted") {
                  toast.timeout = 6000;
                  toasty.warning(toast);
                } else if (task.status === "Exception") {
                  toast.timeout = 10000;
                  toasty.error(toast);
                }
              }
            });
          });
        }
      }

      /**
       * Find out which tasks changed to a final state, by comparing the previous and the current fetched tasks.
       * @returns {Array} - Containing all changed task ids.
       */
      $scope.getNewFinalTasks = function (){
        var older = $scope.taskOverview.oldTasks;
        var newer = $scope.taskOverview.tasks;
        var oldIds = [];
        var newIds = [];
        ["Exception", "Aborted", "Finished"].forEach(function (state) {
          if (older[state].length !== newer[state].length) {
            older[state].forEach(function (task) {
              oldIds.push(task.id);
            });
            newer[state].forEach(function (task) {
              newIds.push(task.id);
            });
          }
        });
        return newIds.filter(function (id) {
          return oldIds.indexOf(id) === -1;
        });
      };

      /**
       * Counts all active tasks and sums up the percentage done of each task.
       */
      $scope.loadOverview = function () {
        if ($http.pendingRequests.length > 0 || !$scope.user) {
          $scope.taskTimeout = $interval($scope.loadOverview, 100, 1);
          return;
        }
        $scope.taskOverview.updated = false;
        angular.copy($scope.taskOverview.tasks, $scope.taskOverview.oldTasks);
        Object.keys($scope.taskOverview.tasks).forEach(function (state) {
            $scope.taskOverview.tasks[state] = [];
        });
        $scope.loadAllTasks();
      };

      $scope.loadAllTasks = function (pgnum) {
        if (pgnum === undefined) {
          pgnum = 1;
        }
        taskQueueService.get({
          pageSize: 100,
          page: pgnum
        })
          .$promise
          .then(function (res) {
            res.results.forEach(function (task) {
              $scope.taskOverview.tasks[task.status].push(task);
            });
            if (res.next !== null) {
              $scope.loadAllTasks(++pgnum);
            } else {
              $scope.updateTaskOverview();
            }
          })
          .catch(function (error) {
            error.toasty = {
              title: "Background task loading failure",
              msg: "Background tasks page " + pgnum + " couldn't be loaded.",
              timeout: 10000
            };
            toasty.error(error.toasty);
            throw error;
          });
      }

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
